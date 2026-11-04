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

test("aggregates ratings, withholding the average below the public threshold", async () => {
  const u2 = await upsertUser(db, { provider: "github", providerUserId: "8", username: "hubot", avatarUrl: null, accountCreatedAt: new Date("2016-01-01") });
  const u3 = await upsertUser(db, { provider: "github", providerUserId: "9", username: "walle", avatarUrl: null, accountCreatedAt: new Date("2016-01-01") });
  // Two ratings — below MIN_PUBLIC_RATINGS (3): average is withheld, but only visible rows count.
  await upsertContribution(db, { userId, distroId, rating: 4, usesIt: true, reviewBody: null });
  await upsertContribution(db, { userId: u2.id, distroId, rating: 2, usesIt: false, reviewBody: null });
  let agg = (await getContributionAggregates(db)).get(distroId);
  expect(agg).toEqual({ average: null, count: 2, usesItCount: 1 });
  // A third rating crosses the threshold: average is revealed.
  await upsertContribution(db, { userId: u3.id, distroId, rating: 3, usesIt: false, reviewBody: null });
  agg = (await getContributionAggregates(db)).get(distroId);
  expect(agg).toEqual({ average: 3, count: 3, usesItCount: 1 });
  // Removing one drops back below the threshold: average withheld again.
  await softRemoveContribution(db, u3.id, distroId);
  agg = (await getContributionAggregates(db)).get(distroId);
  expect(agg).toEqual({ average: null, count: 2, usesItCount: 1 });
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
