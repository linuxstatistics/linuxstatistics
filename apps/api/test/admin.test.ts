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
    payload: { status: "hidden" },
  });
  expect(patch.statusCode).toBe(200);
  const detail = await app.inject({ method: "GET", url: "/api/distros/mint" });
  expect(detail.json().userRating).toEqual({ average: null, count: 0 });
});
