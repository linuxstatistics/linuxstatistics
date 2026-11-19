import { and, asc, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import type { Database } from "./client.js";
import { emailSignups } from "./schema.js";

export type EmailSignupStatus = "pending" | "confirmed" | "unsubscribed" | "legacy";

export interface EmailSignupRow {
  id: number;
  email: string;
  source: string | null;
  createdAt: Date;
  status: EmailSignupStatus;
  confirmSentAt: Date | null;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A confirm link works for 7 days; unconfirmed `pending` rows are deleted after that. */
export const CONFIRM_TTL_MS = 7 * DAY;
/** Legacy rows not confirmed this long after their first confirm email are deleted. */
export const LEGACY_TTL_MS = 30 * DAY;
/** At most one confirm email per address in this window. */
export const CONFIRM_RESEND_GAP_MS = HOUR;

const publicCols = {
  id: emailSignups.id,
  email: emailSignups.email,
  source: emailSignups.source,
  createdAt: emailSignups.createdAt,
  status: emailSignups.status,
  confirmSentAt: emailSignups.confirmSentAt,
  confirmedAt: emailSignups.confirmedAt,
  unsubscribedAt: emailSignups.unsubscribedAt,
};

/** Lower-case and trim, so one person can't be on the list twice by case. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Store a signup without confirmation (kept for the seed and tests).
 * Duplicate emails are a silent no-op.
 */
export async function addEmailSignup(
  db: Database,
  input: { email: string; source?: string | null },
): Promise<void> {
  await db
    .insert(emailSignups)
    .values({ email: normalizeEmail(input.email), source: input.source ?? null })
    .onConflictDoNothing({ target: emailSignups.email });
}

/**
 * Sending is off (no mail key): keep the address as `legacy` so it is asked
 * to confirm once sending works, instead of letting the 7-day purge drop it.
 */
export async function collectEmailSignup(db: Database, input: { email: string; source?: string | null }): Promise<void> {
  await db
    .insert(emailSignups)
    .values({ email: normalizeEmail(input.email), source: input.source ?? null, status: "legacy" })
    .onConflictDoNothing({ target: emailSignups.email });
}

export type SignupRequestResult =
  /** Send a confirm email with this token's link. */
  | { action: "send"; email: string }
  /** Nothing to send: already confirmed, or a confirm email went out within the last hour. */
  | { action: "none" };

/**
 * Record a signup request and decide whether to send a confirm email. Any
 * unconfirmed address (new, pending, legacy, unsubscribed) becomes `pending`
 * with a fresh token, unless a confirm email went out within the last hour.
 * Confirmed addresses are left alone. `tokenHash` is stored only on "send".
 */
export async function requestEmailSignup(
  db: Database,
  input: { email: string; source?: string | null; tokenHash: string; now?: Date },
): Promise<SignupRequestResult> {
  const email = normalizeEmail(input.email);
  const now = input.now ?? new Date();
  const [row] = await db.select().from(emailSignups).where(eq(emailSignups.email, email)).limit(1);
  if (!row) {
    const inserted = await db
      .insert(emailSignups)
      .values({ email, source: input.source ?? null, status: "pending", confirmTokenHash: input.tokenHash, confirmSentAt: now })
      .onConflictDoNothing({ target: emailSignups.email })
      .returning({ id: emailSignups.id });
    return inserted.length ? { action: "send", email } : { action: "none" };
  }
  if (row.status === "confirmed") return { action: "none" };
  // One confirm email per address per hour, also right after an unsubscribe.
  const last = row.status === "unsubscribed" ? row.unsubscribedAt : row.confirmSentAt;
  if (last && now.getTime() - last.getTime() < CONFIRM_RESEND_GAP_MS) return { action: "none" };
  await db
    .update(emailSignups)
    .set({
      status: "pending",
      confirmTokenHash: input.tokenHash,
      confirmSentAt: now,
      unsubscribedAt: null,
      reminderSentAt: null,
      confirmedAt: null,
      ...(row.status === "unsubscribed" ? { source: input.source ?? null, createdAt: now } : {}),
    })
    .where(eq(emailSignups.id, row.id));
  return { action: "send", email };
}

export type ConfirmResult = { ok: true; email: string } | { ok: false; reason: "invalid" | "expired" };

/**
 * Confirm by token hash. Single use: the hash is cleared. A pending link
 * expires 7 days after it was sent; a legacy link works for the whole 30-day
 * window that started with the first ask.
 */
export async function confirmEmailSignup(
  db: Database,
  tokenHash: string,
  now: Date = new Date(),
  /** Runs before the row is marked confirmed (e.g. add the contact to Resend); if it throws, nothing changes and the link still works. */
  beforeCommit?: (email: string) => Promise<void>,
): Promise<ConfirmResult> {
  const [row] = await db.select().from(emailSignups).where(eq(emailSignups.confirmTokenHash, tokenHash)).limit(1);
  if (!row || (row.status !== "pending" && row.status !== "legacy")) return { ok: false, reason: "invalid" };
  const ttl = row.status === "legacy" ? LEGACY_TTL_MS : CONFIRM_TTL_MS;
  if (!row.confirmSentAt || now.getTime() - row.confirmSentAt.getTime() > ttl) return { ok: false, reason: "expired" };
  if (beforeCommit) await beforeCommit(row.email);
  await db
    .update(emailSignups)
    .set({ status: "confirmed", confirmedAt: now, confirmTokenHash: null })
    .where(eq(emailSignups.id, row.id));
  return { ok: true, email: row.email };
}

/**
 * What an unsubscribed row keeps: the address and dates, nothing else, so it
 * works as a suppression record (as the privacy page says).
 */
const UNSUBSCRIBED = (now: Date) => ({
  status: "unsubscribed" as const,
  unsubscribedAt: now,
  source: null,
  confirmTokenHash: null,
  confirmSentAt: null,
  reminderSentAt: null,
  confirmedAt: null,
});

/**
 * Unsubscribe by address (the caller has checked a signed link). Keeps the
 * address as a suppression record so it isn't mailed again. Returns whether
 * a row changed.
 */
export async function unsubscribeEmail(db: Database, email: string, now: Date = new Date()): Promise<boolean> {
  const res = await db
    .update(emailSignups)
    .set(UNSUBSCRIBED(now))
    .where(and(eq(emailSignups.email, normalizeEmail(email)), sql`${emailSignups.status} <> 'unsubscribed'`))
    .returning({ id: emailSignups.id });
  return res.length > 0;
}

/**
 * Mark addresses unsubscribed elsewhere (e.g. Resend's own Broadcast link).
 * Only confirmed and legacy rows: someone who left and is signing up again
 * (pending) is still unsubscribed in Resend until they confirm.
 */
export async function markUnsubscribed(db: Database, emails: string[], now: Date = new Date()): Promise<number> {
  if (!emails.length) return 0;
  const res = await db
    .update(emailSignups)
    .set(UNSUBSCRIBED(now))
    .where(and(inArray(emailSignups.email, emails.map(normalizeEmail)), inArray(emailSignups.status, ["confirmed", "legacy"])))
    .returning({ id: emailSignups.id });
  return res.length;
}

/** Delete pending rows past the confirm window and legacy rows past theirs. */
export async function purgeStaleSignups(db: Database, now: Date = new Date()): Promise<{ pending: number; legacy: number }> {
  const pendingCut = new Date(now.getTime() - CONFIRM_TTL_MS);
  const legacyCut = new Date(now.getTime() - LEGACY_TTL_MS);
  const pending = await db
    .delete(emailSignups)
    // Rows with no confirm_sent_at (stored by an older API version during a deploy) count from created_at.
    .where(and(eq(emailSignups.status, "pending"), lt(sql`coalesce(${emailSignups.confirmSentAt}, ${emailSignups.createdAt})`, pendingCut.toISOString())))
    .returning({ id: emailSignups.id });
  const legacy = await db
    .delete(emailSignups)
    .where(and(eq(emailSignups.status, "legacy"), lt(emailSignups.confirmSentAt, legacyCut)))
    .returning({ id: emailSignups.id });
  return { pending: pending.length, legacy: legacy.length };
}

/** Legacy rows that have never been sent a confirm email. */
export async function legacyNotYetAsked(db: Database): Promise<string[]> {
  const rows = await db
    .select({ email: emailSignups.email })
    .from(emailSignups)
    .where(and(eq(emailSignups.status, "legacy"), isNull(emailSignups.confirmSentAt)))
    .orderBy(asc(emailSignups.id));
  return rows.map((r) => r.email);
}

/** Legacy rows asked at least 7 days ago, not reminded yet. */
export async function legacyDueReminder(db: Database, now: Date = new Date()): Promise<string[]> {
  const cut = new Date(now.getTime() - 7 * DAY);
  const rows = await db
    .select({ email: emailSignups.email })
    .from(emailSignups)
    .where(and(eq(emailSignups.status, "legacy"), lt(emailSignups.confirmSentAt, cut), isNull(emailSignups.reminderSentAt)))
    .orderBy(asc(emailSignups.id));
  return rows.map((r) => r.email);
}

/**
 * Give a legacy row a new confirm token for the first ask or the reminder.
 * The first ask starts the 30-day window (confirm_sent_at); the reminder keeps
 * it and only records reminder_sent_at. Only the newest link works.
 */
export interface LegacyTokenState {
  confirmTokenHash: string | null;
  confirmSentAt: Date | null;
  reminderSentAt: Date | null;
}

/** Returns the row's previous state (for restoreLegacyToken), or null if it isn't a legacy row. */
export async function setLegacyToken(
  db: Database,
  input: { email: string; tokenHash: string; kind: "ask" | "reminder"; now?: Date },
): Promise<LegacyTokenState | null> {
  const now = input.now ?? new Date();
  const where = and(eq(emailSignups.email, normalizeEmail(input.email)), eq(emailSignups.status, "legacy"));
  const [prev] = await db
    .select({ confirmTokenHash: emailSignups.confirmTokenHash, confirmSentAt: emailSignups.confirmSentAt, reminderSentAt: emailSignups.reminderSentAt })
    .from(emailSignups)
    .where(where)
    .limit(1);
  if (!prev) return null;
  await db
    .update(emailSignups)
    .set(input.kind === "ask" ? { confirmTokenHash: input.tokenHash, confirmSentAt: now } : { confirmTokenHash: input.tokenHash, reminderSentAt: now })
    .where(where);
  return prev;
}

/** The email for setLegacyToken failed: put the row back so the next run tries again and the old link still works. */
export async function restoreLegacyToken(db: Database, email: string, prev: LegacyTokenState): Promise<void> {
  await db
    .update(emailSignups)
    .set(prev)
    .where(and(eq(emailSignups.email, normalizeEmail(email)), eq(emailSignups.status, "legacy")));
}

/** All signups, oldest first, for the admin page. */
export async function listEmailSignups(db: Database): Promise<EmailSignupRow[]> {
  const rows = await db.select(publicCols).from(emailSignups).orderBy(asc(emailSignups.createdAt));
  return rows as EmailSignupRow[];
}

/** Confirmed addresses only, oldest first, for the Resend import CSV. */
export async function listConfirmedSignups(db: Database): Promise<EmailSignupRow[]> {
  const rows = await db.select(publicCols).from(emailSignups).where(eq(emailSignups.status, "confirmed")).orderBy(asc(emailSignups.createdAt));
  return rows as EmailSignupRow[];
}

export type EmailStatusCounts = Record<EmailSignupStatus, number>;

export async function emailStatusCounts(db: Database): Promise<EmailStatusCounts> {
  const rows = await db
    .select({ status: emailSignups.status, n: sql<number>`count(*)::int` })
    .from(emailSignups)
    .groupBy(emailSignups.status);
  const out: EmailStatusCounts = { pending: 0, confirmed: 0, unsubscribed: 0, legacy: 0 };
  for (const r of rows) out[r.status] = Number(r.n);
  return out;
}

/** Signups from the last 7 days (any source but legacy) and how many have confirmed. */
export async function emailLastWeek(db: Database, now: Date = new Date()): Promise<{ signups: number; confirmed: number }> {
  const since = new Date(now.getTime() - 7 * DAY);
  const [row] = await db
    .select({
      signups: sql<number>`count(*)::int`,
      confirmed: sql<number>`count(*) filter (where ${emailSignups.status} = 'confirmed')::int`,
    })
    .from(emailSignups)
    .where(and(gte(emailSignups.createdAt, since), ne(emailSignups.status, "legacy")));
  return { signups: Number(row?.signups ?? 0), confirmed: Number(row?.confirmed ?? 0) };
}

/**
 * A confirm email failed to send: let the person try again straight away
 * instead of waiting out the one-hour gap. The row stays in the 7-day purge.
 */
export async function releaseConfirmSlot(db: Database, email: string, now: Date = new Date()): Promise<void> {
  await db
    .update(emailSignups)
    .set({ confirmSentAt: new Date(now.getTime() - CONFIRM_RESEND_GAP_MS), confirmTokenHash: null })
    .where(and(eq(emailSignups.email, normalizeEmail(email)), eq(emailSignups.status, "pending")));
}

/** Addresses unsubscribed here since `since`, to repeat the unsubscribe in Resend (idempotent). */
export async function recentlyUnsubscribed(db: Database, since: Date): Promise<string[]> {
  const rows = await db
    .select({ email: emailSignups.email })
    .from(emailSignups)
    .where(and(eq(emailSignups.status, "unsubscribed"), gte(emailSignups.unsubscribedAt, since)));
  return rows.map((r) => r.email);
}
