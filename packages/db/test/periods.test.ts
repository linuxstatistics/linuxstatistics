import { afterAll, beforeAll, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import {
  addAlias,
  addPopularitySnapshot,
  findDistroIdByAlias,
  upsertDistro,
} from "../src/repository.js";
import { PERIODS as PERIOD_ORDER } from "@linux-statistics/shared";
import { getDistroDetail, getDistroList, getRising, resolveSlug } from "../src/queries.js";

let db: Database;
let client: PGlite;
const now = new Date("2026-11-03T00:00:00.000Z");

beforeAll(async () => {
  ({ db, client } = await setupTestDb());
  // 12-month order: mint, mx, fedora. 1-month order: fedora, mint, mx.
  const rows: [string, string, number, number][] = [
    ["mint", "Mint", 1, 2],
    ["mx", "MX Linux", 2, 3],
    ["fedora", "Fedora", 3, 1],
  ];
  for (const [slug, name, r12, r1] of rows) {
    const id = await upsertDistro(db, { slug, name, family: "other", status: "active" });
    await addAlias(db, "distrowatch", slug, id);
    await addPopularitySnapshot(db, id, { source: "distrowatch", capturedAt: now, rank: r12, hitsPerDay: 1000 - r12, period: "last-12-months" });
    await addPopularitySnapshot(db, id, { source: "distrowatch", capturedAt: now, rank: r1, hitsPerDay: 2000 - r1, period: "last-1-month" });
    await addPopularitySnapshot(db, id, { source: "distrowatch", capturedAt: now, rank: r1, hitsPerDay: 1500 - r1, period: "last-3-months" });
  }
  const mintId = (await findDistroIdByAlias(db, "distrowatch", "mint"))!;
  await addAlias(db, "legacy", "linux-mint", mintId);
});

afterAll(async () => {
  await client.close();
});

test("the main rank comes from the 12-month table; other periods never change it", async () => {
  const list = await getDistroList(db);
  expect(list.map((d) => [d.slug, d.rank])).toEqual([
    ["mint", 1],
    ["mx", 2],
    ["fedora", 3],
  ]);
  expect(list[0]!.hitsPerDay).toBe(999);
});

test("list rows carry the 1-month rank and the climb vs the 12-month rank", async () => {
  const list = await getDistroList(db);
  const fedora = list.find((d) => d.slug === "fedora")!;
  expect(fedora.rank1m).toBe(1);
  expect(fedora.rank1mDelta).toBe(2); // 12-month #3 -> 1-month #1
  expect(list.find((d) => d.slug === "mx")!.rank1mDelta).toBe(-1);
});

test("getRising returns the biggest climbers first, only those that climbed", async () => {
  const rising = await getRising(db, 10);
  expect(rising.map((d) => d.slug)).toEqual(["fedora"]);
});

test("detail rank history uses only the 12-month table", async () => {
  const detail = await getDistroDetail(db, "fedora");
  expect(detail!.rank).toBe(3);
  expect(detail!.rankHistory).toEqual([{ capturedAt: now.toISOString(), value: 3 }]);
});

test("detail lists the latest rank in each period, shortest first", async () => {
  const detail = await getDistroDetail(db, "fedora");
  const periods = detail!.rankByPeriod.map((p) => p.period);
  expect(periods).toEqual([...periods].sort((a, b) => PERIOD_ORDER.indexOf(a) - PERIOD_ORDER.indexOf(b)));
  expect(detail!.rankByPeriod.find((p) => p.period === "last-12-months")?.rank).toBe(3);
});

test("old slugs resolve through legacy aliases", async () => {
  expect(await resolveSlug(db, "linux-mint")).toBe("mint");
  expect(await resolveSlug(db, "mint")).toBe("mint");
  expect(await resolveSlug(db, "nope")).toBeNull();
});
