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

test("non-admin is forbidden from the moderation list", async () => {
  const cookie = await loginAs(app, { providerUserId: "200", username: "user" });
  const res = await app.inject({ method: "GET", url: "/api/admin/contributions", headers: { cookie } });
  expect(res.statusCode).toBe(403);
});

test("admin can list and hide a contribution", async () => {
  const userCookie = await loginAs(app, { providerUserId: "201", username: "rater" });
  await app.inject({
    method: "PUT", url: "/api/distros/mint/contribution", headers: { cookie: userCookie },
    payload: { rating: 1, usesIt: false, reviewBody: "spam" },
  });
  const adminCookie = await loginAs(app, { providerUserId: "999", username: "boss", role: "admin" });
  const list = await app.inject({ method: "GET", url: "/api/admin/contributions", headers: { cookie: adminCookie } });
  expect(list.statusCode).toBe(200);
  const id = list.json()[0].id;
  const patch = await app.inject({
    method: "PATCH", url: `/api/admin/contributions/${id}`, headers: { cookie: adminCookie },
    payload: { action: "hide", reason: "spam" },
  });
  expect(patch.statusCode).toBe(200);
  const noReason = await app.inject({
    method: "PATCH", url: `/api/admin/contributions/${id}`, headers: { cookie: adminCookie },
    payload: { action: "hide" },
  });
  expect(noReason.statusCode).toBe(400);
  const oldShape = await app.inject({
    method: "PATCH", url: `/api/admin/contributions/${id}`, headers: { cookie: adminCookie },
    payload: { status: "removed" },
  });
  expect(oldShape.statusCode).toBe(400);
  const hidden = await app.inject({ method: "GET", url: "/api/admin/ratings?status=hidden", headers: { cookie: adminCookie } });
  expect(hidden.json()).toMatchObject([{ id, hiddenReason: "spam", author: { username: "rater" } }]);
  const detail = await app.inject({ method: "GET", url: "/api/distros/mint" });
  expect(detail.json().userRating).toEqual({ average: null, count: 0, mean: null, verifiedCount: 0 });
});

test("dashboard summary and run history are admin-only", async () => {
  for (const url of ["/api/admin/summary", "/api/admin/sources/github/runs", "/api/admin/quiz", "/api/admin/gaps", "/api/admin/ratings", "/api/admin/email-signups", "/api/admin/email-signups.csv"]) {
    expect((await app.inject({ method: "GET", url })).statusCode, url).toBe(401);
    const userCookie = await loginAs(app, { providerUserId: "210", username: "plain" });
    expect((await app.inject({ method: "GET", url, headers: { cookie: userCookie } })).statusCode, url).toBe(403);
  }
  const cookie = await loginAs(app, { providerUserId: "998", username: "boss2", role: "admin" });
  const s = await app.inject({ method: "GET", url: "/api/admin/summary", headers: { cookie } });
  expect(s.statusCode).toBe(200);
  expect(s.json()).toMatchObject({ quizCompletions: { last7: 0, last30: 0 }, openSuggestions: 0 });
  expect(s.json().sources).toHaveLength(7);
  const runs = await app.inject({ method: "GET", url: "/api/admin/sources/github/runs", headers: { cookie } });
  expect(runs.statusCode).toBe(200);
  expect(runs.json()).toEqual([]);
  const bad = await app.inject({ method: "GET", url: "/api/admin/sources/nope/runs", headers: { cookie } });
  expect(bad.statusCode).toBe(404);
});
