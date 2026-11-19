import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import {
  initPgliteDb,
  addEmailSignup,
  listEmailSignups,
  listConfirmedSignups,
  requestEmailSignup,
  confirmEmailSignup,
  unsubscribeEmail,
  markUnsubscribed,
  purgeStaleSignups,
  legacyNotYetAsked,
  legacyDueReminder,
  setLegacyToken,
  restoreLegacyToken,
  collectEmailSignup,
  emailStatusCounts,
  emailLastWeek,
  schema,
  type Database,
} from "../src/index.js";

let db: Database;
let client: PGlite;

const T0 = new Date("2026-11-19T12:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

beforeEach(async () => {
  const init = await initPgliteDb();
  db = init.db;
  client = init.client;
});

afterEach(async () => { await client.close(); });

async function statusOf(email: string) {
  return (await listEmailSignups(db)).find((r) => r.email === email)?.status;
}

test("addEmailSignup stores a pending signup and ignores duplicates by case", async () => {
  await addEmailSignup(db, { email: "A@Example.com", source: "footer" });
  await addEmailSignup(db, { email: "a@example.com" });
  const rows = await listEmailSignups(db);
  expect(rows).toHaveLength(1);
  expect(rows[0]!.email).toBe("a@example.com");
  expect(rows[0]!.status).toBe("pending");
});

test("a new signup is pending and asks for a confirm email", async () => {
  const r = await requestEmailSignup(db, { email: "New@Example.com", source: "/", tokenHash: "h1", now: T0 });
  expect(r).toEqual({ action: "send", email: "new@example.com" });
  expect(await statusOf("new@example.com")).toBe("pending");
});

test("a repeat within an hour sends nothing; after an hour it sends a new link", async () => {
  await requestEmailSignup(db, { email: "x@example.com", tokenHash: "h1", now: T0 });
  expect(await requestEmailSignup(db, { email: "x@example.com", tokenHash: "h2", now: at(30 * 60_000) })).toEqual({ action: "none" });
  expect(await requestEmailSignup(db, { email: "x@example.com", tokenHash: "h3", now: at(HOUR + 1) })).toEqual({ action: "send", email: "x@example.com" });
  // Only the newest link works.
  expect(await confirmEmailSignup(db, "h1", at(HOUR + 2))).toEqual({ ok: false, reason: "invalid" });
  expect(await confirmEmailSignup(db, "h3", at(HOUR + 2))).toEqual({ ok: true, email: "x@example.com" });
});

test("confirm is single use and expires after 7 days", async () => {
  await requestEmailSignup(db, { email: "c@example.com", tokenHash: "hc", now: T0 });
  expect(await confirmEmailSignup(db, "hc", at(DAY))).toEqual({ ok: true, email: "c@example.com" });
  expect(await statusOf("c@example.com")).toBe("confirmed");
  expect(await confirmEmailSignup(db, "hc", at(DAY))).toEqual({ ok: false, reason: "invalid" });

  await requestEmailSignup(db, { email: "late@example.com", tokenHash: "hl", now: T0 });
  expect(await confirmEmailSignup(db, "hl", at(7 * DAY + 1))).toEqual({ ok: false, reason: "expired" });
});

test("a confirmed address asking again gets nothing", async () => {
  await requestEmailSignup(db, { email: "c@example.com", tokenHash: "h", now: T0 });
  await confirmEmailSignup(db, "h", T0);
  expect(await requestEmailSignup(db, { email: "c@example.com", tokenHash: "h2", now: at(2 * DAY) })).toEqual({ action: "none" });
  expect(await statusOf("c@example.com")).toBe("confirmed");
});

test("unsubscribe keeps only the address and date; signing up again needs a new confirmation after the hour gap", async () => {
  await requestEmailSignup(db, { email: "u@example.com", source: "/distro/mint/", tokenHash: "h", now: T0 });
  await confirmEmailSignup(db, "h", T0);
  expect(await unsubscribeEmail(db, "U@example.com", at(DAY))).toBe(true);
  expect(await unsubscribeEmail(db, "u@example.com", at(DAY))).toBe(false);
  const [row] = await db.select().from(schema.emailSignups).where(eq(schema.emailSignups.email, "u@example.com"));
  expect(row).toMatchObject({
    status: "unsubscribed", source: null, confirmTokenHash: null, confirmSentAt: null, reminderSentAt: null, confirmedAt: null,
  });
  expect(row!.unsubscribedAt?.toISOString()).toBe(at(DAY).toISOString());
  expect(await listConfirmedSignups(db)).toHaveLength(0);
  // One confirm email per hour also applies right after an unsubscribe.
  expect(await requestEmailSignup(db, { email: "u@example.com", tokenHash: "h2", now: at(DAY + 60_000) })).toEqual({ action: "none" });
  expect(await requestEmailSignup(db, { email: "u@example.com", tokenHash: "h3", now: at(DAY + HOUR + 1) })).toEqual({ action: "send", email: "u@example.com" });
  expect(await statusOf("u@example.com")).toBe("pending");
});

test("markUnsubscribed changes listed confirmed and legacy rows, never pending ones", async () => {
  await requestEmailSignup(db, { email: "a@example.com", tokenHash: "a", now: T0 });
  await confirmEmailSignup(db, "a", T0);
  await requestEmailSignup(db, { email: "p@example.com", tokenHash: "p", now: T0 });
  await db.insert(schema.emailSignups).values({ email: "l@example.com", status: "legacy" });
  expect(await markUnsubscribed(db, ["A@example.com", "p@example.com", "l@example.com", "nobody@example.com"])).toBe(2);
  expect(await statusOf("a@example.com")).toBe("unsubscribed");
  expect(await statusOf("l@example.com")).toBe("unsubscribed");
  // A returning subscriber still unsubscribed in Resend keeps their confirm link.
  expect(await statusOf("p@example.com")).toBe("pending");
  expect(await markUnsubscribed(db, [])).toBe(0);
});

test("collectEmailSignup keeps the address as legacy", async () => {
  await collectEmailSignup(db, { email: "C@example.com", source: "/" });
  await collectEmailSignup(db, { email: "c@example.com" });
  expect((await listEmailSignups(db)).map((r) => [r.email, r.status])).toEqual([["c@example.com", "legacy"]]);
});

test("purge deletes pending rows after 7 days and legacy rows after 30, nothing else", async () => {
  await requestEmailSignup(db, { email: "old@example.com", tokenHash: "a", now: T0 });
  await requestEmailSignup(db, { email: "fresh@example.com", tokenHash: "b", now: at(6 * DAY) });
  await requestEmailSignup(db, { email: "conf@example.com", tokenHash: "c", now: T0 });
  await confirmEmailSignup(db, "c", T0);
  // A pending row with no confirm_sent_at (written by an older API during a deploy) ages from created_at.
  await db.insert(schema.emailSignups).values({ email: "nosent@example.com", status: "pending", createdAt: T0 });
  await db.insert(schema.emailSignups).values([
    { email: "leg-old@example.com", status: "legacy", confirmSentAt: T0 },
    { email: "leg-new@example.com", status: "legacy", confirmSentAt: at(10 * DAY) },
    { email: "leg-unasked@example.com", status: "legacy" },
  ]);
  const res = await purgeStaleSignups(db, at(31 * DAY));
  expect(res).toEqual({ pending: 3, legacy: 1 });
  const left = (await listEmailSignups(db)).map((r) => r.email).sort();
  expect(left).toEqual(["conf@example.com", "leg-new@example.com", "leg-unasked@example.com"]);
});

test("legacy rows: first ask, reminder after 7 days, links valid for the 30-day window", async () => {
  await db.insert(schema.emailSignups).values([
    { email: "l1@example.com", status: "legacy" },
    { email: "l2@example.com", status: "legacy" },
  ]);
  expect(await legacyNotYetAsked(db)).toEqual(["l1@example.com", "l2@example.com"]);
  await setLegacyToken(db, { email: "l1@example.com", tokenHash: "ask1", kind: "ask", now: T0 });
  await setLegacyToken(db, { email: "l2@example.com", tokenHash: "ask2", kind: "ask", now: T0 });
  expect(await legacyNotYetAsked(db)).toEqual([]);
  expect(await legacyDueReminder(db, at(6 * DAY))).toEqual([]);
  expect(await legacyDueReminder(db, at(7 * DAY + 1))).toEqual(["l1@example.com", "l2@example.com"]);

  await setLegacyToken(db, { email: "l2@example.com", tokenHash: "rem2", kind: "reminder", now: at(8 * DAY) });
  expect(await legacyDueReminder(db, at(9 * DAY))).toEqual(["l1@example.com"]);
  // The reminder keeps the 30-day window from the first ask.
  const [l2] = await db.select().from(schema.emailSignups).where(eq(schema.emailSignups.email, "l2@example.com"));
  expect(l2!.confirmSentAt?.toISOString()).toBe(T0.toISOString());
  // Reminder link works on day 20; the first link was replaced.
  expect(await confirmEmailSignup(db, "ask2", at(20 * DAY))).toEqual({ ok: false, reason: "invalid" });
  expect(await confirmEmailSignup(db, "rem2", at(20 * DAY))).toEqual({ ok: true, email: "l2@example.com" });
  // After 30 days the first-ask link is expired.
  expect(await confirmEmailSignup(db, "ask1", at(30 * DAY + 1))).toEqual({ ok: false, reason: "expired" });
});

test("restoreLegacyToken undoes a failed ask so the next run retries", async () => {
  await db.insert(schema.emailSignups).values({ email: "r@example.com", status: "legacy" });
  const prev = await setLegacyToken(db, { email: "r@example.com", tokenHash: "x", kind: "ask", now: T0 });
  expect(prev).toEqual({ confirmTokenHash: null, confirmSentAt: null, reminderSentAt: null });
  await restoreLegacyToken(db, "r@example.com", prev!);
  expect(await legacyNotYetAsked(db)).toEqual(["r@example.com"]);
  expect(await setLegacyToken(db, { email: "nobody@example.com", tokenHash: "y", kind: "ask" })).toBeNull();
});

test("a legacy address that uses the form starts over as pending", async () => {
  await db.insert(schema.emailSignups).values({ email: "leg@example.com", status: "legacy", confirmSentAt: T0 });
  expect(await requestEmailSignup(db, { email: "leg@example.com", tokenHash: "n", now: at(2 * DAY) })).toEqual({ action: "send", email: "leg@example.com" });
  expect(await statusOf("leg@example.com")).toBe("pending");
});

test("status counts and last-week confirmations", async () => {
  await requestEmailSignup(db, { email: "a@example.com", tokenHash: "a", now: T0 });
  await requestEmailSignup(db, { email: "b@example.com", tokenHash: "b", now: T0 });
  await confirmEmailSignup(db, "a", T0);
  await db.insert(schema.emailSignups).values({ email: "l@example.com", status: "legacy" });
  expect(await emailStatusCounts(db)).toEqual({ pending: 1, confirmed: 1, unsubscribed: 0, legacy: 1 });
  const week = await emailLastWeek(db, new Date(Date.now() + 60_000));
  expect(week).toEqual({ signups: 2, confirmed: 1 });
});

test("no email-layer statement binds a raw Date inside a sql template (postgres-js can't serialize it)", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const params: unknown[][] = [];
  const logged = drizzle(client, { schema, logger: { logQuery: (_q: string, p: unknown[]) => { params.push(p); } } }) as unknown as Database;
  const now = new Date();
  await requestEmailSignup(logged, { email: "d@example.com", tokenHash: "d", now });
  await confirmEmailSignup(logged, "d", now);
  await unsubscribeEmail(logged, "d@example.com", now);
  await markUnsubscribed(logged, ["d@example.com"], now);
  await purgeStaleSignups(logged, now);
  await legacyDueReminder(logged, now);
  await emailLastWeek(logged, now);
  // Column comparisons encode Dates as strings; a raw Date here only happens in sql`` templates.
  const raw = params.flat().filter((v) => v instanceof Date);
  expect(params.length).toBeGreaterThan(5);
  expect(raw).toEqual([]);
});
