import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import {
  addDistrowatchSnapshot,
  addMarketShare,
  initPgliteDb,
  upsertDistro,
} from "@linux-statistics/db";
import { buildApp } from "../src/app.js";

let app: FastifyInstance;
let client: PGlite;

beforeAll(async () => {
  const { db, client: c } = await initPgliteDb();
  client = c;
  const mintId = await upsertDistro(db, {
    slug: "mint",
    name: "Linux Mint",
    family: "debian",
    status: "active",
  });
  await addDistrowatchSnapshot(db, mintId, {
    capturedAt: new Date(),
    rank: 1,
    hitsPerDay: 2600,
    period: "last-12-months",
  });
  await addMarketShare(db, {
    capturedAt: new Date("2026-01-01T00:00:00Z"),
    region: "global",
    platform: "linux",
    sharePct: 4.13,
  });
  app = await buildApp(db);
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await client.close();
});

test("GET /api/distros returns the leaderboard", async () => {
  const res = await app.inject({ method: "GET", url: "/api/distros" });
  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body[0].slug).toBe("mint");
  expect(body[0].rank).toBe(1);
});

test("GET /api/galaxy puts #1 as the sun", async () => {
  const res = await app.inject({ method: "GET", url: "/api/galaxy" });
  expect(res.statusCode).toBe(200);
  expect(res.json().sun.slug).toBe("mint");
});

test("GET /api/distros/:slug returns detail", async () => {
  const res = await app.inject({ method: "GET", url: "/api/distros/mint" });
  expect(res.statusCode).toBe(200);
  expect(res.json().name).toBe("Linux Mint");
  expect(Array.isArray(res.json().rankHistory)).toBe(true);
});

test("GET /api/distros/:slug returns 404 for unknown", async () => {
  const res = await app.inject({ method: "GET", url: "/api/distros/does-not-exist" });
  expect(res.statusCode).toBe(404);
  expect(res.json().error).toBe("not_found");
});

test("GET /api/market-share returns a series", async () => {
  const res = await app.inject({ method: "GET", url: "/api/market-share?region=global" });
  expect(res.statusCode).toBe(200);
  expect(res.json()[0].sharePct).toBeCloseTo(4.13, 2);
});

test("GET /api/meta reports tracked count", async () => {
  const res = await app.inject({ method: "GET", url: "/api/meta" });
  expect(res.statusCode).toBe(200);
  expect(res.json().trackedDistros).toBe(1);
});
