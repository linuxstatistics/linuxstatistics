import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import { addGithubSnapshot, addPopularitySnapshot, upsertDistro, upsertGithubRepo } from "../src/repository.js";
import { COMPOSITE_WEIGHTS, compositeRanks, rankScore, ranksFromValues, writeCompositeIndex } from "../src/composite.js";
import { countPageView, monthMinus, upsertPageviewMonths, writeInterestIndex } from "../src/interest.js";
import { popularitySnapshots } from "../src/schema.js";

let db: Database;
let client: PGlite;
beforeEach(async () => {
  ({ db, client } = await setupTestDb());
});
afterEach(async () => {
  await client.close();
});

test("weights sum to 1 and rank scores fall from 1 toward 0", () => {
  expect(Object.values(COMPOSITE_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  expect(rankScore(1, 10)).toBe(1);
  expect(rankScore(10, 10)).toBeCloseTo(0.1);
  expect(rankScore(1, 1)).toBe(1);
});

test("ranksFromValues: higher value ranks first, zero values are left out, ties by id", () => {
  const r = ranksFromValues(new Map([[1, 50], [2, 900], [3, 0], [4, 50]]));
  expect([...r]).toEqual([[2, 1], [1, 2], [4, 3]]);
});

test("compositeRanks: weighted sum over covered inputs, missing inputs score 0, unlisted ignored", () => {
  const rows = compositeRanks([1, 2, 3, 9], {
    interest: new Map([[1, 1], [2, 2]]),
    distrowatch: new Map([[2, 1], [1, 2], [3, 3]]),
    github: new Map([[3, 1]]),
    siteViews: new Map(),
  });
  expect(rows.map((r) => r.distroId)).toEqual([1, 2, 3]);
  // id 1: interest 0.5*1 + dw 0.3*(1-1/3) = 0.7 ; id 2: 0.5*0.5 + 0.3*1 = 0.55 ; id 3: dw 0.3*(1/3) + gh 0.1*1 = 0.2
  expect(rows.map((r) => Number(r.score.toFixed(3)))).toEqual([0.7, 0.55, 0.2]);
  expect(rows[2]!.inputs).toEqual(["distrowatch", "github"]);
  expect(rows.find((r) => r.distroId === 9)).toBeUndefined();
});

test("writeCompositeIndex stores source 'composite' for both periods and is idempotent", async () => {
  const a = await upsertDistro(db, { slug: "a", name: "A", family: "other", status: "active" });
  const b = await upsertDistro(db, { slug: "b", name: "B", family: "other", status: "active" });
  const c = await upsertDistro(db, { slug: "c", name: "C", family: "other", status: "active" });
  const cap = new Date("2026-11-01T00:00:00Z");
  // DistroWatch: c first, then a, then b.
  for (const [id, rank] of [[c, 1], [a, 2], [b, 3]] as const) {
    await addPopularitySnapshot(db, id, { source: "distrowatch", capturedAt: cap, rank, hitsPerDay: 100 - rank, period: "last-12-months" });
    await addPopularitySnapshot(db, id, { source: "distrowatch", capturedAt: cap, rank, hitsPerDay: 100 - rank, period: "last-1-month" });
  }
  // Interest: a far ahead of b; c has no article.
  const months = (n: number, v: number) => Array.from({ length: n }, (_, i) => ({ month: monthMinus("2026-10", n - 1 - i), views: v }));
  await upsertPageviewMonths(db, "enwiki", a, months(12, 9000));
  await upsertPageviewMonths(db, "enwiki", b, months(12, 1000));
  await writeInterestIndex(db, "2026-10");
  // GitHub stars only for b; site views only for b.
  const repo = await upsertGithubRepo(db, b, { repoFullName: "b/b", stars: 10, forks: 1, openIssues: 0 });
  await addGithubSnapshot(db, repo, { capturedAt: cap, stars: 10, commitsLast30d: 5, contributors: 2 });
  await countPageView(db, b, "2026-10-20");

  expect(await writeCompositeIndex(db, cap)).toBe(3);
  expect(await writeCompositeIndex(db, cap)).toBe(3);
  const rows = (await db.select().from(popularitySnapshots)).filter((r) => r.source === "composite");
  expect(rows).toHaveLength(6);
  const rank = (id: number, period: string) => rows.find((r) => r.distroId === id && r.period === period)!.rank;
  // a: interest 0.5 + dw 0.3*(2/3)=0.2 -> 0.7 ; b: 0.25 + 0.1 + 0.1 + 0.1 = 0.55 ; c: dw 0.3 -> 0.3
  expect([rank(a, "last-12-months"), rank(b, "last-12-months"), rank(c, "last-12-months")]).toEqual([1, 2, 3]);
  expect(rows.find((r) => r.distroId === a && r.period === "last-12-months")!.hitsPerDay).toBe(700);
});
