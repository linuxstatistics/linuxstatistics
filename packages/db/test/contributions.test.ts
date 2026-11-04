import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  initPgliteDb,
  upsertDistro,
  upsertUser,
  upsertContribution,
  softRemoveContribution,
  getMyContribution,
  getContributionAggregates,
  setContributionStatusById,
  listContributions,
  type Database,
} from "../src/index.js";

let db: Database;
let client: PGlite;
let distroId: number;
let userId: number;

beforeEach(async () => {
  const init = await initPgliteDb();
  db = init.db;
  client = init.client;
  distroId = await upsertDistro(db, { slug: "mint", name: "Linux Mint", family: "debian", status: "active" });
  const u = await upsertUser(db, { provider: "github", providerUserId: "7", username: "octocat", avatarUrl: null, accountCreatedAt: new Date("2015-01-01") });
  userId = u.id;
});

afterEach(async () => { await client.close(); });

test("upsert creates then updates the same row", async () => {
  await upsertContribution(db, { userId, distroId, rating: 4, usesIt: true, reviewBody: "solid" });
  await upsertContribution(db, { userId, distroId, rating: 5, usesIt: true, reviewBody: "better" });
  const mine = await getMyContribution(db, userId, distroId);
  expect(mine).toMatchObject({ rating: 5, usesIt: true, reviewBody: "better" });
});

test("aggregates: smoothed score from the first rating, raw mean, verified count; removed rows drop out", async () => {
  const u2 = await upsertUser(db, { provider: "github", providerUserId: "8", username: "hubot", avatarUrl: null, accountCreatedAt: new Date("2016-01-01") });
  // One 5-star rating: site mean m = 5, so the smoothed score is 5.
  await upsertContribution(db, { userId, distroId, rating: 5, usesIt: true, reviewBody: null });
  let agg = (await getContributionAggregates(db)).get(distroId)!;
  expect(agg).toMatchObject({ average: 5, mean: 5, count: 1, verifiedCount: 1, usesItCount: 1 });
  // A 1-star rating: m = 3, n = 2, sum = 6 -> (5*3 + 6) / (5 + 2) = 3.
  await upsertContribution(db, { userId: u2.id, distroId, rating: 1, usesIt: false, reviewBody: null });
  agg = (await getContributionAggregates(db)).get(distroId)!;
  expect(agg.average).toBeCloseTo(3, 5);
  expect(agg).toMatchObject({ mean: 3, count: 2, verifiedCount: 2 });
  await softRemoveContribution(db, u2.id, distroId);
  agg = (await getContributionAggregates(db)).get(distroId)!;
  expect(agg).toMatchObject({ average: 5, count: 1 });
});

test("smoothing pulls a distro with few ratings toward the site mean", async () => {
  const other = await upsertDistro(db, { slug: "other", name: "Other", family: "other", status: "active" });
  // 10 users rate "other" 3 stars -> site mean pulled toward 3.
  for (let i = 0; i < 10; i++) {
    const u = await upsertUser(db, { provider: "github", providerUserId: `o${i}`, username: `o${i}`, avatarUrl: null, accountCreatedAt: new Date("2016-01-01") });
    await upsertContribution(db, { userId: u.id, distroId: other, rating: 3, usesIt: false, reviewBody: null });
  }
  // One 5-star on our distro: m = (30 + 5) / 11 = 3.1818; score = (5*m + 5) / 6.
  await upsertContribution(db, { userId, distroId, rating: 5, usesIt: false, reviewBody: null });
  const agg = (await getContributionAggregates(db)).get(distroId)!;
  const m = 35 / 11;
  expect(agg.average).toBeCloseTo((5 * m + 5) / 6, 5);
  expect(agg.mean).toBe(5);
});

test("admin can hide a contribution by id", async () => {
  await upsertContribution(db, { userId, distroId, rating: 5, usesIt: false, reviewBody: "x" });
  const rows = await listContributions(db);
  await setContributionStatusById(db, rows[0]!.id, "hidden");
  const agg = (await getContributionAggregates(db)).get(distroId);
  expect(agg).toBeUndefined(); // no visible rows remain
});

test("same username on two providers creates two distinct users", async () => {
  const a = await upsertUser(db, { provider: "github", providerUserId: "100", username: "chris", avatarUrl: null, accountCreatedAt: null });
  const b = await upsertUser(db, { provider: "gitlab", providerUserId: "100", username: "chris", avatarUrl: null, accountCreatedAt: null });
  expect(a.id).not.toBe(b.id);
  expect(a.provider).toBe("github");
  expect(b.provider).toBe("gitlab");
});
