import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, listEmailSignups, requestEmailSignup, confirmEmailSignup, schema, type Database } from "@linux-statistics/db";
import { recordingMailer, disabledMailer } from "@linux-statistics/shared/mailer";
import { runEmailList } from "../src/email-list.js";

const LINKS = { web: "https://site.test", api: "https://site.test" };
const T0 = new Date("2026-11-19T12:00:00Z");
const DAY = 86_400_000;
const at = (ms: number) => new Date(T0.getTime() + ms);

let db: Database;
let client: PGlite;
beforeEach(async () => { ({ db, client } = await initPgliteDb()); });
afterEach(async () => { await client.close(); });

const emails = async () => (await listEmailSignups(db)).map((r) => `${r.email}:${r.status}`).sort();

test("legacy addresses are only asked with askLegacy; then reminded once at day 7; dropped after 30", async () => {
  await db.insert(schema.emailSignups).values([{ email: "a@example.com", status: "legacy" }, { email: "b@example.com", status: "legacy" }]);
  const m = recordingMailer();
  const opts = { links: LINKS, linkSecret: "s" };

  expect((await runEmailList(db, m, { ...opts, now: T0 })).asked).toBe(0);
  expect(m.sent).toHaveLength(0);

  const r1 = await runEmailList(db, m, { ...opts, askLegacy: true, now: T0 });
  expect(r1.asked).toBe(2);
  expect(m.sent.map((x) => x.subject)).toEqual(Array(2).fill("Do you still want the LinuxStatistics email?"));
  expect(m.sent[0]!.headers!["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  // Asking again sends nothing new.
  expect((await runEmailList(db, m, { ...opts, askLegacy: true, now: at(DAY) })).asked).toBe(0);

  const r2 = await runEmailList(db, m, { ...opts, now: at(7 * DAY + 1) });
  expect(r2.reminders).toBe(2);
  expect((await runEmailList(db, m, { ...opts, now: at(8 * DAY) })).reminders).toBe(0);
  expect(m.sent).toHaveLength(4);

  const r3 = await runEmailList(db, m, { ...opts, now: at(30 * DAY + 1) });
  expect(r3.purged).toEqual({ pending: 0, legacy: 2 });
  expect(await emails()).toEqual([]);
});

test("unsubscribes made in Resend are copied here; ours are repeated in Resend", async () => {
  await requestEmailSignup(db, { email: "r@example.com", tokenHash: "h", now: new Date() });
  await confirmEmailSignup(db, "h");
  await requestEmailSignup(db, { email: "k@example.com", tokenHash: "k", now: new Date() });
  await confirmEmailSignup(db, "k");
  const m = recordingMailer({ remoteUnsubscribed: ["R@example.com"] });
  const rep = await runEmailList(db, m, { links: LINKS, linkSecret: "s" });
  expect(rep.syncedFromResend).toBe(1);
  expect(rep.pushedToResend).toBe(1);
  expect(m.unsubscribed).toEqual(["r@example.com"]);
  expect(await emails()).toEqual(["k@example.com:confirmed", "r@example.com:unsubscribed"]);
});

test("a failed legacy send is undone and retried on the next run", async () => {
  await db.insert(schema.emailSignups).values({ email: "x@example.com", status: "legacy" });
  const failing = recordingMailer({ failSend: true });
  const r1 = await runEmailList(db, failing, { links: LINKS, linkSecret: "s", askLegacy: true, now: T0 });
  expect(r1).toMatchObject({ asked: 0, failures: 1 });
  const ok = recordingMailer();
  expect((await runEmailList(db, ok, { links: LINKS, linkSecret: "s", askLegacy: true, now: at(DAY) })).asked).toBe(1);
});

test("without a link secret nothing is sent or synced; the purge still runs", async () => {
  await requestEmailSignup(db, { email: "p@example.com", tokenHash: "h", now: T0 });
  await db.insert(schema.emailSignups).values({ email: "l@example.com", status: "legacy" });
  const m = recordingMailer({ remoteUnsubscribed: ["l@example.com"] });
  const rep = await runEmailList(db, m, { links: LINKS, linkSecret: null, askLegacy: true, now: at(8 * DAY) });
  expect(rep).toMatchObject({ purged: { pending: 1, legacy: 0 }, asked: 0, syncedFromResend: 0 });
  expect(m.sent).toHaveLength(0);
});

test("without a mail key only the purge runs", async () => {
  await requestEmailSignup(db, { email: "p@example.com", tokenHash: "h", now: T0 });
  await db.insert(schema.emailSignups).values({ email: "l@example.com", status: "legacy" });
  const rep = await runEmailList(db, disabledMailer, { links: LINKS, linkSecret: "s", askLegacy: true, now: at(8 * DAY) });
  expect(rep).toMatchObject({ purged: { pending: 1, legacy: 0 }, asked: 0, reminders: 0 });
  expect(await emails()).toEqual(["l@example.com:legacy"]);
});
