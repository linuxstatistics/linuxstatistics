import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import { addAlias, addPopularitySnapshot, upsertDistro } from "../src/repository.js";
import {
  compareRankSources,
  countPageView,
  listEnwikiTitles,
  monthMinus,
  pageViewsSince,
  rankByViews,
  upsertPageviewMonths,
  writeInterestIndex,
} from "../src/interest.js";
import { getDistroList } from "../src/queries.js";
import { popularitySnapshots } from "../src/schema.js";

let db: Database;
let client: PGlite;
beforeEach(async () => {
  ({ db, client } = await setupTestDb());
});
afterEach(async () => {
  await client.close();
});

const months = (to: string, n: number, views: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => ({ month: monthMinus(to, n - 1 - i), views: views(i) }));

test("monthMinus crosses years", () => {
  expect(monthMinus("2026-02", 3)).toBe("2025-11");
  expect(monthMinus("2026-10", 11)).toBe("2025-11");
});

test("rankByViews: per-day average over the window, minimum months, stable ties", () => {
  const v = new Map([
    [1, months("2026-10", 12, () => 3000)],
    [2, months("2026-10", 12, () => 6000)],
    [3, months("2026-10", 3, () => 900000)], // too new for 12 months
    [4, months("2026-10", 12, () => 3000)],
  ]);
  const r = rankByViews(v, "2026-10", 12, 6);
  expect(r.map((x) => [x.distroId, x.rank])).toEqual([[2, 1], [1, 2], [4, 3]]);
  expect(Math.round(r[0]!.perDay)).toBe(197); // 72,000 views / 365 days
  expect(rankByViews(v, "2026-10", 1, 1)[0]!.distroId).toBe(3);
});

test("writeInterestIndex writes 12-month and 1-month ranks as source 'interest' and is idempotent", async () => {
  const a = await upsertDistro(db, { slug: "a", name: "A", family: "other", status: "active" });
  const b = await upsertDistro(db, { slug: "b", name: "B", family: "other", status: "active" });
  await upsertPageviewMonths(db, "enwiki", a, months("2026-10", 12, (i) => (i === 11 ? 100 : 5000)));
  await upsertPageviewMonths(db, "enwiki", b, months("2026-10", 12, (i) => (i === 11 ? 9000 : 1000)));
  expect(await writeInterestIndex(db, "2026-10")).toBe(2);
  expect(await writeInterestIndex(db, "2026-10")).toBe(2);
  const rows = (await db.select().from(popularitySnapshots)).filter((r) => r.source === "interest");
  expect(rows).toHaveLength(4);
  const rank = (id: number, period: string) => rows.find((r) => r.distroId === id && r.period === period)!.rank;
  expect([rank(a, "last-12-months"), rank(b, "last-12-months")]).toEqual([1, 2]);
  expect([rank(a, "last-1-month"), rank(b, "last-1-month")]).toEqual([2, 1]);
  expect(rows[0]!.capturedAt.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  // Shadow period: the public list still uses the main rank source.
  expect((await getDistroList(db)).every((d) => d.rank === null)).toBe(true);
});

test("unlisted discovered distros are not ranked, so ranks have no gaps", async () => {
  const { insertDiscoveredDistro } = await import("../src/repository.js");
  const a = await upsertDistro(db, { slug: "a", name: "A", family: "other", status: "active" });
  const phone = await insertDiscoveredDistro(db, { slug: "phone-os", name: "Phone OS", family: "other", status: "active" }, "wikidata");
  await upsertPageviewMonths(db, "enwiki", a, months("2026-10", 12, () => 100));
  await upsertPageviewMonths(db, "enwiki", phone, months("2026-10", 12, () => 99999));
  expect(await writeInterestIndex(db, "2026-10")).toBe(1);
  const rows = (await db.select().from(popularitySnapshots)).filter((r) => r.source === "interest" && r.period === "last-12-months");
  expect(rows.map((r) => [r.distroId, r.rank])).toEqual([[a, 1]]);
});

test("page views count per distro and day; enwiki titles come from aliases", async () => {
  const a = await upsertDistro(db, { slug: "a", name: "A", family: "other", status: "active" });
  await countPageView(db, a, "2026-11-05");
  await countPageView(db, a, "2026-11-06");
  await countPageView(db, a, "2026-11-06");
  expect((await pageViewsSince(db, "2026-11-06")).get(a)).toBe(2);
  expect((await pageViewsSince(db, "2026-11-01")).get(a)).toBe(3);
  await addAlias(db, "enwiki", "A_(operating_system)", a);
  expect(await listEnwikiTitles(db)).toEqual([{ distroId: a, slug: "a", title: "A_(operating_system)" }]);
});

test("compareRankSources: overlap, correlation and gaps", async () => {
  const ids: number[] = [];
  for (let i = 1; i <= 12; i++) ids.push(await upsertDistro(db, { slug: `d${i}`, name: `D${i}`, family: "other", status: "active" }));
  const at = new Date("2026-11-01T00:00:00Z");
  for (const [i, id] of ids.entries()) {
    await addPopularitySnapshot(db, id, { source: "distrowatch", capturedAt: at, rank: i + 1, hitsPerDay: 10, period: "last-12-months" });
    // Same order, except d1 and d12 swap.
    const r = i === 0 ? 12 : i === 11 ? 1 : i + 1;
    if (i !== 5) await addPopularitySnapshot(db, id, { source: "interest", capturedAt: at, rank: r, hitsPerDay: 10, period: "last-12-months" });
  }
  const c = await compareRankSources(db, "distrowatch", "interest");
  expect(c).toMatchObject({ both: 11, onlyA: 1, onlyB: 0, capturedB: "2026-11-01" });
  expect(c.spearman).toBeLessThan(1);
  expect(c.spearman).toBeGreaterThan(-1);
  expect(c.biggestGaps[0]!.slug).toMatch(/^d(1|12)$/);
  expect(c.topB[0]).toMatchObject({ slug: "d12", a: 12, b: 1 });
});
