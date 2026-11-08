import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  addAlias,
  getDistroDetail,
  getDistroList,
  getRising,
  initPgliteDb,
  upsertDistro,
  type Database,
} from "@linux-statistics/db";
import { parseDistrowatchRanking } from "../src/sources/distrowatch.js";
import { ingestDistrowatchRows } from "../src/ingest-distrowatch.js";

const here = dirname(fileURLToPath(import.meta.url));
const full = readFileSync(resolve(here, "fixtures/ranking-full.html"), "utf8");
const capturedAt = new Date("2026-11-03T12:00:00.000Z");

let db: Database;
let client: PGlite;

beforeAll(async () => {
  ({ db, client } = await initPgliteDb());
  // A distro that already exists, mapped through its DistroWatch alias, with a hand-set
  // family that the curated map doesn't cover.
  const omega = await upsertDistro(db, { slug: "omegalinux", name: "OmegaLinux", family: "arch", status: "active" });
  await addAlias(db, "distrowatch", "omegalinux", omega);
  // Not in the curated map: its existing family must survive ingest.
  const mabox = await upsertDistro(db, { slug: "mabox", name: "Mabox", family: "arch", status: "active" });
  await addAlias(db, "distrowatch", "mabox", mabox);
});

afterAll(async () => {
  await client.close();
});

test("ingesting a full page twice creates each distro once with per-period snapshots", async () => {
  const rows = parseDistrowatchRanking(full);
  const first = await ingestDistrowatchRows(db, rows, capturedAt);
  expect(first.written).toBe(450 * 4);
  expect(first.created).toContain("cachyos");
  await ingestDistrowatchRows(db, rows, new Date("2026-11-04T12:00:00.000Z"));

  const list = await getDistroList(db);
  const slugs = list.map((d) => d.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  // The public rank is the composite; with DistroWatch as the only input, #1 scores 0.3 × 1000.
  expect(list[0]).toMatchObject({ slug: "cachyos", name: "CachyOS", rank: 1, hitsPerDay: 300, family: "arch" });
  expect(list.find((d) => d.slug === "mint")).toMatchObject({ rank: 2, family: "debian" });
}, 30_000); // 2 x 1,800 rows; slow when the whole suite runs in parallel

test("curated families and bases are applied; uncurated distros are logged as other", async () => {
  const rows = parseDistrowatchRanking(full);
  const res = await ingestDistrowatchRows(db, rows, capturedAt);
  const list = await getDistroList(db);
  const top100 = list.filter((d) => d.rank !== null && d.rank <= 100);
  expect(top100.filter((d) => d.family === "other").map((d) => d.slug).sort()).toEqual(["exton", "omegalinux", "reactos"]);
  expect(res.uncurated.length).toBeGreaterThan(300);
  expect(list.find((d) => d.slug === "mabox")!.family).toBe("arch");
  const mint = await getDistroDetail(db, "mint");
  expect(mint!.basedOnSlug).toBe("ubuntu");
});

test("rising is computed from the 1-month table", async () => {
  const rising = await getRising(db, 5);
  expect(rising.length).toBe(5);
  for (const d of rising) expect(d.rank1mDelta).toBeGreaterThan(0);
  const deltas = rising.map((d) => d.rank1mDelta!);
  expect([...deltas].sort((a, b) => b - a)).toEqual(deltas);
});

test("our slug can differ from the DistroWatch key: rows follow the alias, curated data follows our slug", async () => {
  const fresh = await initPgliteDb();
  try {
    const id = await upsertDistro(fresh.db, { slug: "linux-mint", name: "Linux Mint", family: "other", status: "active" });
    await addAlias(fresh.db, "distrowatch", "mint", id);
    const html = `<table><tr><th class="Invert">Last 12 months</th></tr>${["mint", "a1", "a2", "a3", "a4"]
      .map((k, i) => `<tr><th class="phr1">${i + 1}</th><td class="phr2"><a href="${k}">${k}</a></td><td class="phr3">${900 - i}</td></tr>`)
      .join("")}</table>`;
    const res = await ingestDistrowatchRows(fresh.db, parseDistrowatchRanking(html), capturedAt);
    expect(res.created).not.toContain("mint");
    const list = await getDistroList(fresh.db);
    expect(list.find((d) => d.slug === "linux-mint")).toMatchObject({ rank: 1 });
    expect(list.some((d) => d.slug === "mint")).toBe(false);
    // "linux-mint" isn't curated (curated keys use "mint"), so its family is left alone.
    expect(res.uncurated).toContain("linux-mint");
  } finally {
    await fresh.client.close();
  }
});

test("a DistroWatch key matching an existing slug joins that distro instead of duplicating it", async () => {
  const fresh = await initPgliteDb();
  try {
    await upsertDistro(fresh.db, { slug: "a1", name: "A1 (ours)", family: "other", status: "active" });
    const html = `<table><tr><th class="Invert">Last 12 months</th></tr>${["a1", "a2", "a3", "a4", "a5"]
      .map((k, i) => `<tr><th class="phr1">${i + 1}</th><td class="phr2"><a href="${k}">${k}</a></td><td class="phr3">${900 - i}</td></tr>`)
      .join("")}</table>`;
    const res = await ingestDistrowatchRows(fresh.db, parseDistrowatchRanking(html), capturedAt);
    expect(res.created).not.toContain("a1");
    const a1 = (await getDistroList(fresh.db)).filter((d) => d.slug === "a1");
    expect(a1).toEqual([expect.objectContaining({ name: "A1 (ours)", rank: 1 })]);
  } finally {
    await fresh.client.close();
  }
});
