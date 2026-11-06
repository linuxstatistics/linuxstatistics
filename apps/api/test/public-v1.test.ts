import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, upsertDistro, addPopularitySnapshot } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

let app: FastifyInstance;
let client: PGlite;

beforeAll(async () => {
  process.env.ALLOW_DEV_LOGIN = "1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  const init = await initPgliteDb();
  client = init.client;
  const id = await upsertDistro(init.db, { slug: "mint", name: "Mint", family: "debian", status: "active" });
  await addPopularitySnapshot(init.db, id, { source: "distrowatch", capturedAt: new Date("2026-11-01"), period: "last-12-months", rank: 2, hitsPerDay: 1900 });
  app = await buildApp(init.db);
  await app.ready();
});
afterAll(async () => { await app.close(); await client.close(); });

test("v1 list is public, cacheable and licensed", async () => {
  const res = await app.inject({ method: "GET", url: "/api/v1/distros", headers: { origin: "https://example.org" } });
  expect(res.statusCode).toBe(200);
  expect(res.headers["access-control-allow-origin"]).toBe("*");
  expect(res.headers["cache-control"]).toContain("max-age=300");
  expect(res.headers["set-cookie"]).toBeUndefined();
  const body = res.json();
  expect(body.license).toBe("CC-BY-4.0");
  expect(body.data.map((d: { slug: string }) => d.slug)).toContain("mint");
  for (const k of ["rank", "hitsPerDay", "rankTrend", "rank1m", "rank1mDelta"]) expect(k in body.data[0]).toBe(false);
});

test("v1 detail has no ranking data and never the caller's own contribution", async () => {
  const cookie = await loginAs(app, { providerUserId: "70", username: "u70" });
  const res = await app.inject({ method: "GET", url: "/api/v1/distros/mint", headers: { cookie } });
  expect(res.statusCode).toBe(200);
  const data = res.json().data;
  expect(data.slug).toBe("mint");
  for (const k of ["myContribution", "rank", "hitsPerDay", "rankHistory", "rankByPeriod"]) expect(k in data).toBe(false);
  expect((await app.inject({ method: "GET", url: "/api/v1/distros/nope" })).statusCode).toBe(404);
});
