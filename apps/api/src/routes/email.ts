import type { FastifyInstance, FastifyReply } from "fastify";
import { emailSignupInputSchema, emailTokenInputSchema, type EmailStatusSummary } from "@linux-statistics/shared";
import { hashEmailToken, newEmailToken, unsubscribeToken, verifyUnsubscribeToken } from "@linux-statistics/shared/email-tokens";
import { confirmEmail, emailConfigFromEnv, type LinkSet, type Mailer } from "@linux-statistics/shared/mailer";
import {
  collectEmailSignup,
  confirmEmailSignup,
  emailLastWeek,
  emailStatusCounts,
  listConfirmedSignups,
  listEmailSignups,
  releaseConfirmSlot,
  requestEmailSignup,
  unsubscribeEmail,
  type Database,
} from "@linux-statistics/db";
import { requireAdmin } from "../lib/session.js";

export interface EmailRouteOptions {
  mailer?: Mailer;
  /** Signs unsubscribe links; required in production. */
  linkSecret?: string;
  links?: LinkSet;
  /** Signups per IP per minute (tests raise it). */
  signupsPerMinute?: number;
}

export function linksFromEnv(env: NodeJS.ProcessEnv = process.env): LinkSet {
  const web = (env.WEB_ORIGIN ?? "http://localhost:4380").replace(/\/$/, "");
  const api = (env.API_PUBLIC_URL ?? web).replace(/\/$/, "");
  return { web, api };
}

export function registerEmailRoutes(app: FastifyInstance, db: Database, opts: EmailRouteOptions = {}): void {
  const fromEnv = opts.mailer ? null : emailConfigFromEnv();
  if (fromEnv?.problem) console.error(`email: ${fromEnv.problem}`);
  const mailer = opts.mailer ?? fromEnv!.mailer;
  // Without a secret nothing is sent, so no links exist to verify; a random one refuses every token.
  const secret = opts.linkSecret ?? fromEnv?.linkSecret ?? newEmailToken();
  const links = opts.links ?? linksFromEnv();

  // One-click unsubscribe (RFC 8058) posts a form body (urlencoded or multipart); the token is in ?t=, so the body is ignored.
  app.register(async (scope) => {
    scope.removeAllContentTypeParsers();
    scope.addContentTypeParser("*", { parseAs: "string" }, (_req, _body, done) => done(null, null));
    scope.post(
      "/api/email-signups/unsubscribe/one-click",
      { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
      async (req, reply) => {
        const t = (req.query as { t?: unknown }).t;
        const email = typeof t === "string" ? verifyUnsubscribeToken(t, secret) : null;
        if (!email) {
          reply.code(400);
          return { ok: false, reason: "invalid" };
        }
        await doUnsubscribe(email);
        return { ok: true };
      },
    );
  });

  // A mail client without one-click opens the header URL in a browser: show the page, change nothing.
  app.get("/api/email-signups/unsubscribe/one-click", async (req, reply) => {
    const t = (req.query as { t?: unknown }).t;
    return reply.redirect(`${links.web}/email/unsubscribe/${typeof t === "string" ? `?t=${encodeURIComponent(t)}` : ""}`, 303);
  });

  async function doUnsubscribe(email: string): Promise<void> {
    await unsubscribeEmail(db, email);
    try {
      await mailer.unsubscribeContact(email);
    } catch (err) {
      // Our list is the record; the daily job repeats the Resend side.
      console.error("Resend unsubscribe failed:", err instanceof Error ? err.message : err);
    }
  }

  app.post(
    "/api/email-signups",
    { config: { rateLimit: { max: opts.signupsPerMinute ?? 10, timeWindow: "1 minute" } } },
    async (req) => {
      // Invalid email throws ZodError -> mapped to 400 by the app error handler.
      const body = emailSignupInputSchema.parse(req.body);
      // Same answer for every case so the form can't be used to test who is subscribed.
      if (body.website) return { ok: true };
      if (!mailer.enabled) {
        await collectEmailSignup(db, { email: body.email, source: body.source });
        return { ok: true };
      }
      const token = newEmailToken();
      const result = await requestEmailSignup(db, { email: body.email, source: body.source, tokenHash: hashEmailToken(token) });
      if (result.action === "send") {
        try {
          await mailer.send(confirmEmail(result.email, token, unsubscribeToken(result.email, secret), links));
        } catch (err) {
          console.error("confirm email failed:", err instanceof Error ? err.message : err);
          await releaseConfirmSlot(db, result.email);
        }
      }
      return { ok: true };
    },
  );

  app.post(
    "/api/email-signups/confirm",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const { token } = emailTokenInputSchema.parse(req.body);
      try {
        const res = await confirmEmailSignup(db, hashEmailToken(token), new Date(), (email) => mailer.addContact(email));
        if (!res.ok) {
          reply.code(400);
          return { ok: false, reason: res.reason };
        }
        return { ok: true };
      } catch (err) {
        console.error("confirm failed:", err instanceof Error ? err.message : err);
        reply.code(503);
        return { ok: false, reason: "unavailable" };
      }
    },
  );

  // Unsubscribe from the site page: JSON { token }.
  app.post(
    "/api/email-signups/unsubscribe",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req, reply: FastifyReply) => {
      const { token } = emailTokenInputSchema.parse(req.body);
      const email = verifyUnsubscribeToken(token, secret);
      if (!email) {
        reply.code(400);
        return { ok: false, reason: "invalid" };
      }
      await doUnsubscribe(email);
      return { ok: true };
    },
  );

  app.get("/api/admin/email-signups", { preHandler: requireAdmin(db) }, async () => listEmailSignups(db));

  app.get("/api/admin/email-summary", { preHandler: requireAdmin(db) }, async (): Promise<EmailStatusSummary> => ({
    counts: await emailStatusCounts(db),
    lastWeek: await emailLastWeek(db),
  }));

  // Confirmed addresses as a CSV for Resend's contact import (Audience → Contacts → Import).
  app.get("/api/admin/email-signups.csv", { preHandler: requireAdmin(db) }, async (_req, reply) => {
    const rows = await listConfirmedSignups(db);
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="email-signups.csv"');
    return ["email,created_at", ...rows.map((r) => `${csvField(r.email)},${new Date(r.createdAt).toISOString()}`)].join("\n") + "\n";
  });
}

/** Quote a CSV field; neutralise leading =+-@ so spreadsheet apps don't run it as a formula. */
function csvField(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
