import { afterAll, beforeAll, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import {
  addDistrowatchSnapshot,
  addGithubSnapshot,
  addMarketShare,
  recordIngestionRun,
  upsertDistro,
  upsertGithubRepo,
} from "../src/repository.js";
import {
  getDistroDetail,
  getDistroList,
  getGalaxy,
  getMarketShare,
  getMeta,
} from "../src/queries.js";
import { initPgliteDb, upsertUser, upsertContribution } from "../src/index.js";

let db: Database;
let client: PGlite;

const now = new Date("2026-06-01T00:00:00.000Z");
const yearAgo = new Date("2025-06-01T00:00:00.000Z");

beforeAll(async () => {
  ({ db, client } = await setupTestDb());

  // Mint: improved from rank 5 -> rank 1
  const mintId = await upsertDistro(db, {
    slug: "mint",
    name: "Linux Mint",
    family: "debian",
    status: "active",
  });
  await addDistrowatchSnapshot(db, mintId, { capturedAt: yearAgo, rank: 5, hitsPerDay: 1500, period: "last-12-months" });
  await addDistrowatchSnapshot(db, mintId, { capturedAt: now, rank: 1, hitsPerDay: 2600, period: "last-12-months" });
  const mintRepo = await upsertGithubRepo(db, mintId, { repoFullName: "linuxmint/cinnamon", stars: 5200, forks: 800, openIssues: 120 });
  await addGithubSnapshot(db, mintRepo, { capturedAt: now, stars: 5200, commitsLast30d: 180, contributors: 90 });

  // Fedora: slipped from rank 2 -> rank 3
  const fedoraId = await upsertDistro(db, {
    slug: "fedora",
    name: "Fedora",
    family: "rpm",
    status: "active",
  });
  await addDistrowatchSnapshot(db, fedoraId, { capturedAt: yearAgo, rank: 2, hitsPerDay: 1900, period: "last-12-months" });
  await addDistrowatchSnapshot(db, fedoraId, { capturedAt: now, rank: 3, hitsPerDay: 1700, period: "last-12-months" });

  await addMarketShare(db, { capturedAt: yearAgo, region: "global", platform: "linux", sharePct: 3.8 });
  await addMarketShare(db, { capturedAt: now, region: "global", platform: "linux", sharePct: 4.13 });

  await recordIngestionRun(db, "distrowatch", "success", 2);
});

afterAll(async () => {
  await client.close();
});

test("getDistroList returns rows sorted by rank with trend", async () => {
  const list = await getDistroList(db);
  expect(list.map((d) => d.slug)).toEqual(["mint", "fedora"]);
  const mint = list[0]!;
  expect(mint.rank).toBe(1);
  expect(mint.hitsPerDay).toBe(2600);
  expect(mint.stars).toBe(5200);
  expect(mint.commitsLast30d).toBe(180);
  expect(mint.rankTrend).toBe(4); // 5 -> 1 = improved by 4
  expect(list[1]!.rankTrend).toBe(-1); // 2 -> 3 = slipped by 1
});

test("getGalaxy puts the #1 distro as the sun", async () => {
  const galaxy = await getGalaxy(db);
  expect(galaxy.sun.slug).toBe("mint");
  expect(galaxy.sun.popularity).toBeCloseTo(1, 5); // highest hits
  expect(galaxy.planets.map((p) => p.slug)).toContain("fedora");
});

test("getDistroDetail includes history", async () => {
  const detail = await getDistroDetail(db, "mint");
  expect(detail).not.toBeNull();
  expect(detail!.rankHistory).toHaveLength(2);
  expect(detail!.rankHistory[0]!.value).toBe(5);
  expect(detail!.rankHistory[1]!.value).toBe(1);
  expect(detail!.repoFullName).toBe("linuxmint/cinnamon");
});

test("getDistroDetail returns null for unknown slug", async () => {
  expect(await getDistroDetail(db, "nope")).toBeNull();
});

test("getMarketShare returns an ordered series", async () => {
  const series = await getMarketShare(db, { region: "global" });
  expect(series).toHaveLength(2);
  expect(series[0]!.sharePct).toBeCloseTo(3.8, 2);
  expect(series[1]!.sharePct).toBeCloseTo(4.13, 2);
});

test("getMeta reports tracked count and source freshness", async () => {
  const meta = await getMeta(db);
  expect(meta.trackedDistros).toBe(2);
  const dw = meta.sources.find((s) => s.source === "distrowatch")!;
  expect(dw.status).toBe("success");
  expect(dw.lastSuccessAt).not.toBeNull();
  const gh = meta.sources.find((s) => s.source === "github")!;
  expect(gh.status).toBe("never");
});

test("getDistroList includes user-rating aggregates with the public threshold", async () => {
  const { db, client } = await initPgliteDb();
  const id = await upsertDistro(db, { slug: "mint", name: "Linux Mint", family: "debian", status: "active" });
  await addDistrowatchSnapshot(db, id, { capturedAt: new Date(), rank: 1, hitsPerDay: 2600, period: "p" });
  const u = await upsertUser(db, { provider: "github", providerUserId: "1", username: "a", avatarUrl: null, accountCreatedAt: new Date("2015-01-01") });
  await upsertContribution(db, { userId: u.id, distroId: id, rating: 4, usesIt: true, reviewBody: null });
  // One rating is below the threshold: average withheld, usesItCount still reported.
  let list = await getDistroList(db);
  expect(list[0]!.userRating).toEqual({ average: null, count: 1 });
  expect(list[0]!.usesItCount).toBe(1);
  // Two more ratings cross the threshold: average is revealed.
  const u2 = await upsertUser(db, { provider: "github", providerUserId: "2", username: "b", avatarUrl: null, accountCreatedAt: new Date("2015-01-01") });
  const u3 = await upsertUser(db, { provider: "github", providerUserId: "3", username: "c", avatarUrl: null, accountCreatedAt: new Date("2015-01-01") });
  await upsertContribution(db, { userId: u2.id, distroId: id, rating: 2, usesIt: false, reviewBody: null });
  await upsertContribution(db, { userId: u3.id, distroId: id, rating: 3, usesIt: false, reviewBody: null });
  list = await getDistroList(db);
  expect(list[0]!.userRating).toEqual({ average: 3, count: 3 });
  await client.close();
});

test("getDistroDetail returns myContribution for the requesting user", async () => {
  const { db, client } = await initPgliteDb();
  const id = await upsertDistro(db, { slug: "mint", name: "Linux Mint", family: "debian", status: "active" });
  const u = await upsertUser(db, { provider: "github", providerUserId: "1", username: "a", avatarUrl: null, accountCreatedAt: new Date("2015-01-01") });
  await upsertContribution(db, { userId: u.id, distroId: id, rating: 5, usesIt: false, reviewBody: "hi" });
  const detail = await getDistroDetail(db, "mint", u.id);
  expect(detail!.myContribution).toMatchObject({ rating: 5, usesIt: false, reviewBody: "hi" });
  const anon = await getDistroDetail(db, "mint");
  expect(anon!.myContribution).toBeNull();
  await client.close();
});
