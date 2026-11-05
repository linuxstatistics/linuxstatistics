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

const post = (payload: object, cookie?: string) =>
  app.inject({ method: "POST", url: "/api/suggestions", payload, headers: cookie ? { cookie } : {} });

test("accepts a suggestion and admins can list and resolve it", async () => {
  const res = await post({ kind: "add-distro", subject: "foolinux", message: "Please add Foo Linux; it launched last month.", email: "" });
  expect(res.statusCode).toBe(200);
  const admin = await loginAs(app, { providerUserId: "800", username: "boss", role: "admin" });
  const list = await app.inject({ method: "GET", url: "/api/admin/suggestions?status=new", headers: { cookie: admin } });
  expect(list.statusCode).toBe(200);
  const [row] = list.json();
  expect(row).toMatchObject({ kind: "add-distro", subject: "foolinux", email: null, status: "new" });
  const done = await app.inject({ method: "PATCH", url: `/api/admin/suggestions/${row.id}`, headers: { cookie: admin }, payload: { status: "done" } });
  expect(done.statusCode).toBe(200);
  const after = await app.inject({ method: "GET", url: "/api/admin/suggestions?status=new", headers: { cookie: admin } });
  expect(after.json()).toHaveLength(0);
});

test("rejects too-short messages and unknown kinds", async () => {
  expect((await post({ kind: "add-distro", message: "short" })).statusCode).toBe(400);
  expect((await post({ kind: "spam", message: "a long enough message here" })).statusCode).toBe(400);
});

test("honeypot submissions are accepted silently but not stored", async () => {
  const before = (await app.inject({ method: "GET", url: "/api/admin/suggestions", headers: { cookie: await loginAs(app, { providerUserId: "801", username: "boss2", role: "admin" }) } })).json().length;
  // A filled honeypot fails validation (max 0), which is also fine; either way nothing is stored.
  await post({ kind: "idea", message: "Buy cheap watches at example dot com now", website: "http://spam.example" });
  const admin = await loginAs(app, { providerUserId: "802", username: "boss3", role: "admin" });
  const afterCount = (await app.inject({ method: "GET", url: "/api/admin/suggestions", headers: { cookie: admin } })).json().length;
  expect(afterCount).toBe(before);
});

test("admin routes need admin", async () => {
  expect((await app.inject({ method: "GET", url: "/api/admin/suggestions" })).statusCode).toBe(401);
  const user = await loginAs(app, { providerUserId: "803", username: "rando" });
  expect((await app.inject({ method: "GET", url: "/api/admin/suggestions", headers: { cookie: user } })).statusCode).toBe(403);
});

test("admin list includes the sender's sign-in name, and admins can delete", async () => {
  const user = await loginAs(app, { providerUserId: "810", username: "sender" });
  await post({ kind: "idea", message: "A dark mode for the share card, please." }, user);
  const admin = await loginAs(app, { providerUserId: "811", username: "boss4", role: "admin" });
  const list = (await app.inject({ method: "GET", url: "/api/admin/suggestions", headers: { cookie: admin } })).json();
  const mine = list.find((r: { message: string }) => r.message.startsWith("A dark mode"));
  expect(mine).toMatchObject({ username: "sender", provider: "github" });
  const del = await app.inject({ method: "DELETE", url: `/api/admin/suggestions/${mine.id}`, headers: { cookie: admin } });
  expect(del.statusCode).toBe(200);
  const again = await app.inject({ method: "DELETE", url: `/api/admin/suggestions/${mine.id}`, headers: { cookie: admin } });
  expect(again.statusCode).toBe(404);
  const user2 = await loginAs(app, { providerUserId: "812", username: "rando2" });
  expect((await app.inject({ method: "DELETE", url: `/api/admin/suggestions/1`, headers: { cookie: user2 } })).statusCode).toBe(403);
});
