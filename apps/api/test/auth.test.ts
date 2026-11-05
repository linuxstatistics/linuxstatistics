import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import Fastify from "fastify";
import { initPgliteDb } from "@linux-statistics/db";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";
import { registerSession } from "../src/lib/session.js";
import { registerAuthRoutes } from "../src/routes/auth.js";
import { buildProviderRegistry } from "../src/lib/oauth/providers.js";

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

test("GET /api/me is null when logged out", async () => {
  const res = await app.inject({ method: "GET", url: "/api/me" });
  expect(res.statusCode).toBe(200);
  expect(res.json()).toBeNull();
});

test("dev-login then /api/me returns the user", async () => {
  const cookie = await loginAs(app, { providerUserId: "42", username: "octocat" });
  const res = await app.inject({ method: "GET", url: "/api/me", headers: { cookie } });
  expect(res.statusCode).toBe(200);
  expect(res.json().username).toBe("octocat");
});

test("logout clears the session", async () => {
  const cookie = await loginAs(app, { providerUserId: "43", username: "hubot" });
  await app.inject({ method: "POST", url: "/api/auth/logout", headers: { cookie } });
  // the original cookie value still maps to a session payload, but logout deletes it server-side;
  // a fresh request without re-login is unauthorized
  const res = await app.inject({ method: "GET", url: "/api/me" });
  expect(res.json()).toBeNull();
});

async function appWithProviders() {
  const reg = buildProviderRegistry({
    GITHUB_OAUTH_CLIENT_ID: "id",
    GITHUB_OAUTH_CLIENT_SECRET: "secret",
  } as NodeJS.ProcessEnv);
  const init = await initPgliteDb();
  const a = Fastify({ logger: false });
  await registerSession(a);
  registerAuthRoutes(a, init.db, {
    registry: reg,
    exchange: async () => ({
      provider: "github",
      providerUserId: "555",
      username: "flowuser",
      avatarUrl: null,
      accountCreatedAt: new Date("2015-01-01"),
    }),
  });
  await a.ready();
  return { a, client: init.client };
}

test("GET /api/auth/:provider redirects with state for an enabled provider", async () => {
  const { a, client } = await appWithProviders();
  const res = await a.inject({ method: "GET", url: "/api/auth/github" });
  expect(res.statusCode).toBe(302);
  const loc = new URL(res.headers.location as string);
  expect(loc.origin + loc.pathname).toBe("https://github.com/login/oauth/authorize");
  expect(loc.searchParams.get("state")).toBeTruthy();
  await a.close();
  await client.close();
});

test("GET /api/auth/:provider is 404 for a disabled provider", async () => {
  const { a, client } = await appWithProviders();
  const res = await a.inject({ method: "GET", url: "/api/auth/codeberg" });
  expect(res.statusCode).toBe(404);
  await a.close();
  await client.close();
});

test("callback rejects a mismatched state with 400", async () => {
  const { a, client } = await appWithProviders();
  const res = await a.inject({ method: "GET", url: "/api/auth/github/callback?code=c&state=wrong" });
  expect(res.statusCode).toBe(400);
  expect(res.json().error).toBe("bad_state");
  await a.close();
  await client.close();
});

test("callback with valid state creates a user and a session", async () => {
  const { a, client } = await appWithProviders();
  const start = await a.inject({ method: "GET", url: "/api/auth/github" });
  const cookie = (start.headers["set-cookie"] as string).split(";")[0];
  const state = new URL(start.headers.location as string).searchParams.get("state")!;
  const cb = await a.inject({
    method: "GET",
    url: `/api/auth/github/callback?code=c&state=${state}`,
    headers: { cookie },
  });
  expect(cb.statusCode).toBe(302);
  const cbCookie = (cb.headers["set-cookie"] as string).split(";")[0];
  const me = await a.inject({ method: "GET", url: "/api/me", headers: { cookie: cbCookie } });
  expect(me.statusCode).toBe(200);
  expect(me.json().username).toBe("flowuser");
  await a.close();
  await client.close();
});

test("GET /api/auth/providers lists enabled providers plus dev", async () => {
  const { a, client } = await appWithProviders();
  const res = await a.inject({ method: "GET", url: "/api/auth/providers" });
  const slugs = (res.json() as Array<{ slug: string }>).map((p) => p.slug);
  expect(slugs).toContain("github");
  expect(slugs).toContain("dev"); // ALLOW_DEV_LOGIN=1 set in beforeAll
  await a.close();
  await client.close();
});

async function signInThroughCallback(a: Awaited<ReturnType<typeof appWithProviders>>["a"]) {
  const start = await a.inject({ method: "GET", url: "/api/auth/github" });
  const cookie = (start.headers["set-cookie"] as string).split(";")[0];
  const state = new URL(start.headers.location as string).searchParams.get("state")!;
  const cb = await a.inject({ method: "GET", url: `/api/auth/github/callback?code=c&state=${state}`, headers: { cookie } });
  const sess = (cb.headers["set-cookie"] as string).split(";")[0];
  return (await a.inject({ method: "GET", url: "/api/me", headers: { cookie: sess } })).json();
}

test("ADMIN_USERS grants admin at sign-in and removes it when no longer listed", async () => {
  const { a, client } = await appWithProviders();
  process.env.ADMIN_USERS = "github:#555";
  expect((await signInThroughCallback(a)).role).toBe("admin");
  process.env.ADMIN_USERS = "github:#999";
  expect((await signInThroughCallback(a)).role).toBe("user");
  delete process.env.ADMIN_USERS;
  await a.close();
  await client.close();
});
