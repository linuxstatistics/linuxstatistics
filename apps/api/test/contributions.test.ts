import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, upsertDistro } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

let app: FastifyInstance;
let client: PGlite;

beforeAll(async () => {
  process.env.ALLOW_DEV_LOGIN = "1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  const init = await initPgliteDb();
  client = init.client;
  await upsertDistro(init.db, { slug: "mint", name: "Linux Mint", family: "debian", status: "active" });
  app = await buildApp(init.db);
  await app.ready();
});

afterAll(async () => { await app.close(); await client.close(); });

test("PUT contribution requires auth", async () => {
  const res = await app.inject({
    method: "PUT", url: "/api/distros/mint/contribution",
    payload: { rating: 5, usesIt: true, reviewBody: null },
  });
  expect(res.statusCode).toBe(401);
});

test("rejects accounts younger than 30 days", async () => {
  const recent = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const cookie = await loginAs(app, { providerUserId: "100", username: "newbie", accountCreatedAt: recent });
  const res = await app.inject({
    method: "PUT", url: "/api/distros/mint/contribution", headers: { cookie },
    payload: { rating: 5, usesIt: true, reviewBody: null },
  });
  expect(res.statusCode).toBe(403);
});

test("upserts a contribution and reflects it in detail", async () => {
  const cookie = await loginAs(app, { providerUserId: "101", username: "veteran" }); // default age 2015
  const put = await app.inject({
    method: "PUT", url: "/api/distros/mint/contribution", headers: { cookie },
    payload: { rating: 4, usesIt: true, reviewBody: "great" },
  });
  expect(put.statusCode).toBe(200);
  const detail = await app.inject({ method: "GET", url: "/api/distros/mint", headers: { cookie } });
  expect(detail.json().myContribution).toMatchObject({ rating: 4, usesIt: true });
  // One rating is below the public threshold, so the average is withheld (null).
  expect(detail.json().userRating).toEqual({ average: null, count: 1 });
});

test("rejects an empty contribution", async () => {
  const cookie = await loginAs(app, { providerUserId: "102", username: "empty" });
  const res = await app.inject({
    method: "PUT", url: "/api/distros/mint/contribution", headers: { cookie },
    payload: { rating: null, usesIt: false, reviewBody: null },
  });
  expect(res.statusCode).toBe(400);
});

test("DELETE soft-removes the caller's contribution", async () => {
  const cookie = await loginAs(app, { providerUserId: "103", username: "leaver" });
  await app.inject({
    method: "PUT", url: "/api/distros/mint/contribution", headers: { cookie },
    payload: { rating: 2, usesIt: false, reviewBody: null },
  });
  const del = await app.inject({ method: "DELETE", url: "/api/distros/mint/contribution", headers: { cookie } });
  expect(del.statusCode).toBe(200);
  const detail = await app.inject({ method: "GET", url: "/api/distros/mint", headers: { cookie } });
  expect(detail.json().myContribution).toBeNull();
});
