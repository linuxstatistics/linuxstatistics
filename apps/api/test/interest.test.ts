import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, pageViewsSince, upsertDistro, type Database } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { isBotUserAgent } from "../src/routes/interest.js";
import { loginAs } from "./helpers.js";

let app: FastifyInstance;
let client: PGlite;
let db: Database;
let mint: number;

beforeAll(async () => {
  process.env.ALLOW_DEV_LOGIN = "1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  const init = await initPgliteDb();
  ({ client, db } = init);
  mint = await upsertDistro(db, { slug: "mint", name: "Mint", family: "debian", status: "active" });
  app = await buildApp(db);
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await client.close();
});

const BROWSER = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

test("view beacon counts browsers only, stores no visitor data and ignores unknown slugs", async () => {
  const hit = (ua: string, slug = "mint") => app.inject({ method: "POST", url: `/api/views/${slug}`, headers: { "user-agent": ua } });
  expect((await hit(BROWSER)).statusCode).toBe(204);
  expect((await hit(BROWSER)).statusCode).toBe(204);
  expect((await hit("Googlebot/2.1 (+http://www.google.com/bot.html)")).statusCode).toBe(204);
  expect((await hit(BROWSER, "nope")).statusCode).toBe(204);
  const today = new Date().toISOString().slice(0, 10);
  expect((await pageViewsSince(db, today)).get(mint)).toBe(2);
  expect((await hit(BROWSER)).headers["set-cookie"]).toBeUndefined();
});

test("bot filter", () => {
  expect(isBotUserAgent(undefined)).toBe(true);
  expect(isBotUserAgent("curl/8.4.0")).toBe(true);
  expect(isBotUserAgent("facebookexternalhit/1.1 (preview)")).toBe(true);
  expect(isBotUserAgent(BROWSER)).toBe(false);
});

test("rank comparison is admin-only", async () => {
  expect((await app.inject({ method: "GET", url: "/api/admin/rank-compare" })).statusCode).toBe(401);
  const cookie = await loginAs(app, { providerUserId: "90", username: "boss", role: "admin" });
  const res = await app.inject({ method: "GET", url: "/api/admin/rank-compare", headers: { cookie } });
  expect(res.statusCode).toBe(200);
  expect(res.json()).toMatchObject({ a: "distrowatch", b: "interest", both: 0, capturedB: null });
});
