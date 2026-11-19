import { afterAll, beforeAll, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

let app: FastifyInstance;
let client: PGlite;
let dir: string;

beforeAll(async () => {
  process.env.ALLOW_DEV_LOGIN = "1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  dir = mkdtempSync(join(tmpdir(), "admin-pages-"));
  mkdirSync(join(dir, "quiz"));
  writeFileSync(join(dir, "index.html"), "<h1>Dashboard</h1>");
  writeFileSync(join(dir, "quiz/index.html"), "<h1>Quiz</h1>");
  writeFileSync(join(dir, "_404.html"), "<h1>Page not found</h1>");
  writeFileSync(join(dir, "..", "secret.html"), "outside");
  process.env.ADMIN_PAGES_DIR = dir;
  const init = await initPgliteDb();
  client = init.client;
  app = await buildApp(init.db);
  await app.ready();
});

afterAll(async () => {
  delete process.env.ADMIN_PAGES_DIR;
  await app.close();
  await client.close();
  rmSync(dir, { recursive: true, force: true });
  rmSync(join(dir, "..", "secret.html"), { force: true });
});

const get = (url: string, cookie?: string) => app.inject({ method: "GET", url, headers: cookie ? { cookie } : {} });

test("signed-out visitors and non-admins get the plain 404 page, not the admin page", async () => {
  const user = await loginAs(app, { providerUserId: "301", username: "plain" });
  for (const cookie of [undefined, user]) {
    for (const url of ["/admin", "/admin/", "/admin/quiz/", "/admin/nope/"]) {
      const res = await get(url, cookie);
      expect(res.statusCode, url).toBe(404);
      expect(res.body, url).toBe("<h1>Page not found</h1>");
      expect(res.headers["cache-control"], url).toBe("no-store");
    }
  }
});

test("admins get the page, never cached and never indexed", async () => {
  const admin = await loginAs(app, { providerUserId: "302", username: "boss", role: "admin" });
  const home = await get("/admin/", admin);
  expect(home.statusCode).toBe(200);
  expect(home.body).toBe("<h1>Dashboard</h1>");
  expect(home.headers["cache-control"]).toBe("private, no-store");
  expect(home.headers["x-robots-tag"]).toBe("noindex, nofollow");
  expect((await get("/admin/quiz", admin)).body).toBe("<h1>Quiz</h1>");
  expect((await get("/admin/quiz/?x=1", admin)).body).toBe("<h1>Quiz</h1>");
});

test("admins can't read files outside the admin folder or the internal 404 file", async () => {
  const admin = await loginAs(app, { providerUserId: "303", username: "boss3", role: "admin" });
  for (const url of ["/admin/../secret.html", "/admin/%2e%2e/secret.html", "/admin/_404.html", "/admin/missing/"]) {
    const res = await get(url, admin);
    expect(res.statusCode, url).toBe(404);
    expect(res.body, url).not.toContain("outside");
  }
});
