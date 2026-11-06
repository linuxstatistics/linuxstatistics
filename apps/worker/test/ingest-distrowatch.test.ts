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
  // A distro that already exists, keyed by DistroWatch key, with a hand-set
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
  expect(list[0]).toMatchObject({ slug: "cachyos", name: "CachyOS", rank: 1, hitsPerDay: 4000, family: "arch" });
  expect(list.find((d) => d.slug === "mint")).toMatchObject({ rank: 2, family: "debian" });
});

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
