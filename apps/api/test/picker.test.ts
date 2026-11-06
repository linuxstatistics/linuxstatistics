import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, addPickerFeedback, getPickerFit, QUIZ_FIT_MIN_VOTES, type Database } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

let app: FastifyInstance;
let client: PGlite;
let db: Database;

beforeAll(async () => {
  process.env.ALLOW_DEV_LOGIN = "1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  const init = await initPgliteDb();
  client = init.client;
  db = init.db;
  app = await buildApp(db);
  await app.ready();
});

afterAll(async () => { await app.close(); await client.close(); });

test("accepts an anonymous vote without a session", async () => {
  const res = await app.inject({ method: "POST", url: "/api/picker-feedback", payload: { topKey: "mint", code: "1213", fit: true } });
  expect(res.statusCode).toBe(200);
  expect(await getPickerFit(db, "mint")).toEqual({ up: 1, total: 1 });
});

test("rejects a bad key or a non-digit code", async () => {
  for (const payload of [{ topKey: "Mint!", code: "1", fit: true }, { topKey: "mint", code: "abc", fit: false }, { topKey: "mint", code: "1" }]) {
    const res = await app.inject({ method: "POST", url: "/api/picker-feedback", payload });
    expect(res.statusCode).toBe(400);
  }
});

test("a filled honeypot is rejected and stores nothing", async () => {
  const before = await getPickerFit(db, "zorin");
  const res = await app.inject({ method: "POST", url: "/api/picker-feedback", payload: { topKey: "zorin", code: "1", fit: true, website: "x" } });
  expect(res.statusCode).toBe(400);
  expect(await getPickerFit(db, "zorin")).toEqual(before);
});

test("admin CSV export needs an admin and lists votes", async () => {
  expect((await app.inject({ method: "GET", url: "/api/admin/picker-feedback.csv" })).statusCode).toBe(401);
  const cookie = await loginAs(app, { providerUserId: "900", username: "boss", role: "admin" });
  const res = await app.inject({ method: "GET", url: "/api/admin/picker-feedback.csv", headers: { cookie } });
  expect(res.statusCode).toBe(200);
  expect(res.headers["content-type"]).toContain("text/csv");
  const lines = res.body.trim().split("\n");
  expect(lines[0]).toBe("id,day,top_key,code,fit");
  expect(lines[1]).toMatch(/^\d+,\d{4}-\d{2}-\d{2},mint,1213,1$/);
});

test("fit counts are split up and total", async () => {
  for (let i = 0; i < QUIZ_FIT_MIN_VOTES; i++) await addPickerFeedback(db, { topKey: "fedora", code: "2", fit: i % 3 !== 0 });
  expect(await getPickerFit(db, "fedora")).toEqual({ up: 20, total: 30 });
});
