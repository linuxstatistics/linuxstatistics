import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, listEmailSignups, schema, type Database } from "@linux-statistics/db";
import { recordingMailer, disabledMailer, emailConfigFromEnv } from "@linux-statistics/shared/mailer";
import { unsubscribeToken } from "@linux-statistics/shared/email-tokens";
import { buildApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

const SECRET = "test-link-secret";
const LINKS = { web: "https://site.test", api: "https://api.test" };

let app: FastifyInstance;
let client: PGlite;
let db: Database;
let mailer: ReturnType<typeof recordingMailer>;

beforeAll(async () => {
  process.env.ALLOW_DEV_LOGIN = "1";
  process.env.SESSION_SECRET = "test-session-secret-at-least-32-chars!!";
  const init = await initPgliteDb();
  client = init.client;
  db = init.db;
  mailer = recordingMailer();
  app = await buildApp(init.db, { email: { mailer, linkSecret: SECRET, links: LINKS, signupsPerMinute: 1000 } });
  await app.ready();
});

afterAll(async () => { await app.close(); await client.close(); });

beforeEach(() => {
  mailer.sent.length = 0;
  mailer.contacts.length = 0;
  mailer.unsubscribed.length = 0;
});

const signup = (payload: Record<string, unknown>) => app.inject({ method: "POST", url: "/api/email-signups", payload });

/** The confirm token from the last email's link. */
function lastConfirmToken(): string {
  const m = mailer.sent.at(-1)!.text.match(/\/email\/confirm\/\?t=([^\s]+)/);
  return decodeURIComponent(m![1]!);
}

async function status(email: string) {
  return (await listEmailSignups(db)).find((r) => r.email === email)?.status;
}

test("a valid signup is pending and gets one confirm email with unsubscribe headers", async () => {
  const res = await signup({ email: "New@Example.com", source: "footer" });
  expect(res.statusCode).toBe(200);
  expect(res.json()).toEqual({ ok: true });
  expect(await status("new@example.com")).toBe("pending");
  expect(mailer.sent).toHaveLength(1);
  const msg = mailer.sent[0]!;
  expect(msg.to).toBe("new@example.com");
  expect(msg.subject).toMatch(/confirm/i);
  expect(msg.text).toContain("https://site.test/email/confirm/?t=");
  expect(msg.headers!["List-Unsubscribe"]).toMatch(/^<https:\/\/api\.test\/api\/email-signups\/unsubscribe\/one-click\?t=/);
  expect(msg.headers!["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  // No tracking: links point straight at our own site.
  expect(msg.html).not.toMatch(/resend\.(com|dev)\/(click|track)/);
});

test("rejects an invalid email with 400", async () => {
  const res = await signup({ email: "nope" });
  expect(res.statusCode).toBe(400);
  expect(res.json().error).toBe("bad_request");
  expect(res.json().details.fieldErrors.email?.length).toBeGreaterThan(0);
});

test("the honeypot answers ok and stores and sends nothing", async () => {
  const res = await signup({ email: "bot@example.com", website: "http://spam" });
  expect(res.json()).toEqual({ ok: true });
  expect(await status("bot@example.com")).toBeUndefined();
  expect(mailer.sent).toHaveLength(0);
});

test("a repeat within an hour gets the same answer and no second email", async () => {
  await signup({ email: "dup@example.com" });
  const second = await signup({ email: "dup@example.com" });
  expect(second.json()).toEqual({ ok: true });
  expect(mailer.sent).toHaveLength(1);
  const rows = (await listEmailSignups(db)).filter((r) => r.email === "dup@example.com");
  expect(rows).toHaveLength(1);
});

test("confirming adds the contact to Resend; the link is single use", async () => {
  await signup({ email: "conf@example.com" });
  const token = lastConfirmToken();
  const ok = await app.inject({ method: "POST", url: "/api/email-signups/confirm", payload: { token } });
  expect(ok.json()).toEqual({ ok: true });
  expect(await status("conf@example.com")).toBe("confirmed");
  expect(mailer.contacts).toEqual(["conf@example.com"]);
  const again = await app.inject({ method: "POST", url: "/api/email-signups/confirm", payload: { token } });
  expect(again.statusCode).toBe(400);
  expect(again.json()).toEqual({ ok: false, reason: "invalid" });
  // A confirmed address signing up again gets no email and the same answer.
  expect((await signup({ email: "conf@example.com" })).json()).toEqual({ ok: true });
  expect(mailer.sent).toHaveLength(1);
});

test("a GET on the confirm API does nothing (mail scanners prefetch links)", async () => {
  await signup({ email: "scan@example.com" });
  const token = lastConfirmToken();
  const res = await app.inject({ method: "GET", url: `/api/email-signups/confirm?token=${encodeURIComponent(token)}` });
  expect(res.statusCode).toBe(404);
  expect(await status("scan@example.com")).toBe("pending");
});

test("if Resend fails during confirm, the row stays pending and the link still works", async () => {
  const failing = recordingMailer({ failContact: true });
  const init = await initPgliteDb();
  const a = await buildApp(init.db, { email: { mailer: failing, linkSecret: SECRET, links: LINKS } });
  await a.inject({ method: "POST", url: "/api/email-signups", payload: { email: "f@example.com" } });
  const token = decodeURIComponent(failing.sent[0]!.text.match(/\/email\/confirm\/\?t=([^\s]+)/)![1]!);
  const res = await a.inject({ method: "POST", url: "/api/email-signups/confirm", payload: { token } });
  expect(res.statusCode).toBe(503);
  expect((await listEmailSignups(init.db))[0]!.status).toBe("pending");
  await a.close();
  await init.client.close();
});

test("if the confirm email fails to send, the person can retry at once", async () => {
  const failing = recordingMailer({ failSend: true });
  const init = await initPgliteDb();
  const a = await buildApp(init.db, { email: { mailer: failing, linkSecret: SECRET, links: LINKS } });
  expect((await a.inject({ method: "POST", url: "/api/email-signups", payload: { email: "s@example.com" } })).json()).toEqual({ ok: true });
  const [row] = await init.db.select().from(schema.emailSignups);
  expect(row!.confirmTokenHash).toBeNull();
  expect(Date.now() - row!.confirmSentAt!.getTime()).toBeGreaterThanOrEqual(3_600_000);
  await a.close();
  await init.client.close();
});

test("unsubscribe from the page (JSON) and from the one-click header (urlencoded or multipart)", async () => {
  await signup({ email: "u1@example.com" });
  const page = await app.inject({
    method: "POST", url: "/api/email-signups/unsubscribe",
    payload: { token: unsubscribeToken("u1@example.com", SECRET) },
  });
  expect(page.json()).toEqual({ ok: true });
  expect(await status("u1@example.com")).toBe("unsubscribed");
  expect(mailer.unsubscribed).toEqual(["u1@example.com"]);

  await signup({ email: "u2@example.com" });
  const oneClick = await app.inject({
    method: "POST",
    url: `/api/email-signups/unsubscribe/one-click?t=${encodeURIComponent(unsubscribeToken("u2@example.com", SECRET))}`,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    payload: "List-Unsubscribe=One-Click",
  });
  expect(oneClick.statusCode).toBe(200);
  expect(await status("u2@example.com")).toBe("unsubscribed");

  await signup({ email: "u3@example.com" });
  const multipart = await app.inject({
    method: "POST",
    url: `/api/email-signups/unsubscribe/one-click?t=${encodeURIComponent(unsubscribeToken("u3@example.com", SECRET))}`,
    headers: { "content-type": "multipart/form-data; boundary=xyz" },
    payload: '--xyz\r\nContent-Disposition: form-data; name="List-Unsubscribe"\r\n\r\nOne-Click\r\n--xyz--\r\n',
  });
  expect(multipart.statusCode).toBe(200);
  expect(await status("u3@example.com")).toBe("unsubscribed");
});

test("a GET on the one-click URL redirects to the page and changes nothing", async () => {
  await signup({ email: "g@example.com" });
  const t = unsubscribeToken("g@example.com", SECRET);
  const res = await app.inject({ method: "GET", url: `/api/email-signups/unsubscribe/one-click?t=${encodeURIComponent(t)}` });
  expect(res.statusCode).toBe(303);
  expect(res.headers.location).toBe(`https://site.test/email/unsubscribe/?t=${encodeURIComponent(t)}`);
  expect(await status("g@example.com")).toBe("pending");
});

test("a tampered or foreign unsubscribe token is refused", async () => {
  await signup({ email: "keep@example.com" });
  const forged = unsubscribeToken("keep@example.com", "other-secret");
  const res = await app.inject({ method: "POST", url: "/api/email-signups/unsubscribe", payload: { token: forged } });
  expect(res.statusCode).toBe(400);
  expect(await status("keep@example.com")).toBe("pending");
});

test("admin summary and CSV list confirmed addresses only, and need an admin", async () => {
  await signup({ email: "csv-pending@example.com" });
  await signup({ email: "csv-conf@example.com" });
  await app.inject({ method: "POST", url: "/api/email-signups/confirm", payload: { token: lastConfirmToken() } });
  expect((await app.inject({ method: "GET", url: "/api/admin/email-signups.csv" })).statusCode).toBe(401);
  const cookie = await loginAs(app, { providerUserId: "902", username: "boss2", role: "admin" });
  const res = await app.inject({ method: "GET", url: "/api/admin/email-signups.csv", headers: { cookie } });
  expect(res.statusCode).toBe(200);
  expect(res.headers["content-type"]).toContain("text/csv");
  const lines = res.body.trim().split("\n");
  expect(lines[0]).toBe("email,created_at");
  expect(lines.some((l) => l.startsWith("csv-conf@example.com,"))).toBe(true);
  expect(lines.some((l) => l.startsWith("csv-pending@example.com,"))).toBe(false);
  const summary = await app.inject({ method: "GET", url: "/api/admin/email-summary", headers: { cookie } });
  expect(summary.json().counts.confirmed).toBeGreaterThanOrEqual(1);
  expect(summary.json().lastWeek.signups).toBeGreaterThanOrEqual(summary.json().lastWeek.confirmed);
});

test("signups are rate limited per IP", async () => {
  const init = await initPgliteDb();
  const a = await buildApp(init.db, { email: { mailer: recordingMailer(), linkSecret: SECRET, links: LINKS, signupsPerMinute: 2 } });
  const codes: number[] = [];
  for (let i = 0; i < 3; i++) codes.push((await a.inject({ method: "POST", url: "/api/email-signups", payload: { email: `r${i}@example.com` } })).statusCode);
  expect(codes).toEqual([200, 200, 429]);
  await a.close();
  await init.client.close();
});

test("sending needs both the Resend key and EMAIL_LINK_SECRET in production", () => {
  const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv;
  expect(emailConfigFromEnv(env({ NODE_ENV: "production", RESEND_API_KEY: "k" }))).toMatchObject({ linkSecret: null, mailer: { enabled: false } });
  expect(emailConfigFromEnv(env({ NODE_ENV: "production", EMAIL_LINK_SECRET: "s" })).mailer.enabled).toBe(false);
  expect(emailConfigFromEnv(env({ NODE_ENV: "production", RESEND_API_KEY: "k", EMAIL_LINK_SECRET: "s" }))).toMatchObject({ linkSecret: "s", problem: null, mailer: { enabled: true } });
  // SESSION_SECRET is never used as a fallback (the worker doesn't have it).
  expect(emailConfigFromEnv(env({ NODE_ENV: "production", RESEND_API_KEY: "k", SESSION_SECRET: "x" })).linkSecret).toBeNull();
});

test("with sending off, signups are kept as legacy (asked later) instead of pending", async () => {
  const init = await initPgliteDb();
  const a = await buildApp(init.db, { email: { mailer: disabledMailer, linkSecret: SECRET, links: LINKS } });
  expect((await a.inject({ method: "POST", url: "/api/email-signups", payload: { email: "Off@Example.com" } })).json()).toEqual({ ok: true });
  const rows = await listEmailSignups(init.db);
  expect(rows.map((r) => [r.email, r.status])).toEqual([["off@example.com", "legacy"]]);
  await a.close();
  await init.client.close();
});
