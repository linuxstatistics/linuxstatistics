import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

let app: FastifyInstance;
let client: PGlite;

beforeAll(async () => {
  process.env.ALLOW_DEV_LOGIN = "1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  const init = await initPgliteDb();
  client = init.client;
  app = await buildApp(init.db);
  await app.ready();
});

afterAll(async () => { await app.close(); await client.close(); });

test("accepts a valid signup", async () => {
  const res = await app.inject({
    method: "POST", url: "/api/email-signups",
    payload: { email: "new@example.com", source: "footer" },
  });
  expect(res.statusCode).toBe(200);
  expect(res.json().ok).toBe(true);
});

test("rejects an invalid email with 400", async () => {
  const res = await app.inject({
    method: "POST", url: "/api/email-signups", payload: { email: "nope" },
  });
  expect(res.statusCode).toBe(400);
});

test("a duplicate still returns ok and does not create a second row", async () => {
  await app.inject({ method: "POST", url: "/api/email-signups", payload: { email: "dup@example.com" } });
  const second = await app.inject({ method: "POST", url: "/api/email-signups", payload: { email: "dup@example.com" } });
  expect(second.statusCode).toBe(200);
  const adminCookie = await loginAs(app, { providerUserId: "900", username: "boss", role: "admin" });
  const list = await app.inject({ method: "GET", url: "/api/admin/email-signups", headers: { cookie: adminCookie } });
  const dupRows = list.json().filter((r: { email: string }) => r.email === "dup@example.com");
  expect(dupRows).toHaveLength(1);
});

test("admin export requires admin", async () => {
  const res = await app.inject({ method: "GET", url: "/api/admin/email-signups" });
  expect(res.statusCode).toBe(401);
  const userCookie = await loginAs(app, { providerUserId: "901", username: "rando" });
  const res2 = await app.inject({ method: "GET", url: "/api/admin/email-signups", headers: { cookie: userCookie } });
  expect(res2.statusCode).toBe(403);
});
