import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, listQuizCompletions, listSwitchReports, type Database } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

let app: FastifyInstance;
let client: PGlite;
let db: Database;
const UA = { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0" };
const tok = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

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

const postQuiz = (payload: object, headers: Record<string, string> = UA) =>
  app.inject({ method: "POST", url: "/api/quiz-completions", payload, headers });

test("stores a finished quiz for either quiz, once per token", async () => {
  expect((await postQuiz({ quiz: "pick", code: "1213", topKey: "mint", token: tok(1) })).statusCode).toBe(204);
  expect((await postQuiz({ quiz: "pick", code: "1213", topKey: "mint", token: tok(1) })).statusCode).toBe(204);
  expect((await postQuiz({ quiz: "start", code: "windows.pc.gaming.amd", topKey: "bazzite", token: tok(2) })).statusCode).toBe(204);
  expect((await listQuizCompletions(db)).map((r) => [r.quiz, r.code, r.topKey])).toEqual([
    ["pick", "1213", "mint"],
    ["start", "windows.pc.gaming.amd", "bazzite"],
  ]);
});

test("rejects free text, bad keys and bad tokens", async () => {
  for (const payload of [
    { quiz: "pick", code: "hello", topKey: "mint", token: tok(3) },
    { quiz: "start", code: "Hello there, I'm Bob", topKey: "mint", token: tok(3) },
    { quiz: "pick", code: "1", topKey: "Mint!", token: tok(3) },
    { quiz: "pick", code: "1", topKey: "mint", token: "abc" },
    { quiz: "other", code: "1", topKey: "mint", token: tok(3) },
  ]) expect((await postQuiz(payload)).statusCode).toBe(400);
});

test("bots, a filled honeypot and Global Privacy Control store nothing", async () => {
  const before = (await listQuizCompletions(db)).length;
  await postQuiz({ quiz: "pick", code: "1", topKey: "mint", token: tok(4) }, { "user-agent": "Googlebot/2.1" });
  await postQuiz({ quiz: "pick", code: "1", topKey: "mint", token: tok(5) }, { ...UA, "sec-gpc": "1" });
  expect((await postQuiz({ quiz: "pick", code: "1", topKey: "mint", token: tok(6), website: "x" })).statusCode).toBe(400);
  expect((await listQuizCompletions(db)).length).toBe(before);
});

test("the same visit can take its quiz back with the token", async () => {
  await postQuiz({ quiz: "pick", code: "22", topKey: "fedora", token: tok(7) });
  expect((await app.inject({ method: "DELETE", url: `/api/quiz-completions/${tok(7)}` })).statusCode).toBe(204);
  expect((await listQuizCompletions(db)).some((r) => r.topKey === "fedora")).toBe(false);
  expect((await app.inject({ method: "DELETE", url: "/api/quiz-completions/nope" })).statusCode).toBe(400);
});

test("switch reports: valid choices only, distro optional, bots skipped", async () => {
  const post = (payload: object, headers = UA) => app.inject({ method: "POST", url: "/api/switch-reports", payload, headers });
  expect((await post({ cameFrom: "windows", nowUsing: "mint", page: "quiz" })).statusCode).toBe(204);
  expect((await post({ cameFrom: "macos", page: "distro" })).statusCode).toBe(204);
  expect((await post({ cameFrom: "amiga", page: "quiz" })).statusCode).toBe(400);
  expect((await post({ cameFrom: "windows", page: "home" })).statusCode).toBe(400);
  await post({ cameFrom: "windows", page: "quiz" }, { "user-agent": "curl/8" });
  expect((await listSwitchReports(db)).map((r) => [r.cameFrom, r.nowUsing, r.page])).toEqual([
    ["windows", "mint", "quiz"],
    ["macos", null, "distro"],
  ]);
});

test("admin CSV exports need an admin and never include tokens", async () => {
  expect((await app.inject({ method: "GET", url: "/api/admin/quiz-completions.csv" })).statusCode).toBe(401);
  const cookie = await loginAs(app, { providerUserId: "901", username: "boss", role: "admin" });
  const q = await app.inject({ method: "GET", url: "/api/admin/quiz-completions.csv", headers: { cookie } });
  expect(q.body.split("\n")[0]).toBe("id,day,quiz,code,top_key");
  expect(q.body).not.toContain("0000-4000");
  const s = await app.inject({ method: "GET", url: "/api/admin/switch-reports.csv", headers: { cookie } });
  expect(s.body).toMatch(/^id,day,came_from,now_using,page\n\d+,\d{4}-\d{2}-\d{2},windows,mint,quiz\n/);
});
