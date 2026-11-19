import {
  legacyDueReminder,
  legacyNotYetAsked,
  markUnsubscribed,
  purgeStaleSignups,
  recentlyUnsubscribed,
  restoreLegacyToken,
  setLegacyToken,
  type Database,
} from "@linux-statistics/db";
import { hashEmailToken, newEmailToken, unsubscribeToken } from "@linux-statistics/shared/email-tokens";
import { legacyConfirmEmail, type LinkSet, type Mailer } from "@linux-statistics/shared/mailer";

export interface EmailListReport {
  purged: { pending: number; legacy: number };
  /** Addresses that unsubscribed in Resend and are now unsubscribed here. */
  syncedFromResend: number;
  /** Our recent unsubscribes repeated in Resend (idempotent). */
  pushedToResend: number;
  reminders: number;
  asked: number;
  failures: number;
}

/**
 * Daily list upkeep. Never asks legacy addresses for the first time unless
 * `askLegacy` is set (the owner checks the count and runs that once by hand).
 */
export async function runEmailList(
  db: Database,
  mailer: Mailer,
  opts: { links: LinkSet; linkSecret: string | null; askLegacy?: boolean; now?: Date; log?: (m: string) => void },
): Promise<EmailListReport> {
  const now = opts.now ?? new Date();
  const log = opts.log ?? (() => {});
  const report: EmailListReport = { purged: { pending: 0, legacy: 0 }, syncedFromResend: 0, pushedToResend: 0, reminders: 0, asked: 0, failures: 0 };

  const sending = mailer.enabled && opts.linkSecret !== null;
  if (sending) {
    try {
      report.syncedFromResend = await markUnsubscribed(db, await mailer.listUnsubscribed(), now);
    } catch (err) {
      report.failures++;
      log(`Resend unsubscribe sync failed: ${err instanceof Error ? err.message : err}`);
    }
    for (const email of await recentlyUnsubscribed(db, new Date(now.getTime() - 2 * 86_400_000))) {
      try {
        await mailer.unsubscribeContact(email);
        report.pushedToResend++;
      } catch (err) {
        report.failures++;
        log(`Resend unsubscribe for one address failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  report.purged = await purgeStaleSignups(db, now);

  if (sending) {
    const secret = opts.linkSecret!;
    const sendLegacy = async (email: string, kind: "ask" | "reminder") => {
      const token = newEmailToken();
      const prev = await setLegacyToken(db, { email, tokenHash: hashEmailToken(token), kind, now });
      if (!prev) return false;
      try {
        await mailer.send({
          ...legacyConfirmEmail(email, token, unsubscribeToken(email, secret), opts.links, kind),
          idempotencyKey: `legacy-${kind}-${hashEmailToken(email).slice(0, 32)}`,
        });
        return true;
      } catch (err) {
        // Put the row back: the next run tries again and the earlier link keeps working.
        await restoreLegacyToken(db, email, prev);
        report.failures++;
        log(`legacy ${kind} email failed: ${err instanceof Error ? err.message : err}`);
        return false;
      }
    };
    for (const email of await legacyDueReminder(db, now)) if (await sendLegacy(email, "reminder")) report.reminders++;
    if (opts.askLegacy) for (const email of await legacyNotYetAsked(db)) if (await sendLegacy(email, "ask")) report.asked++;
  }
  return report;
}
