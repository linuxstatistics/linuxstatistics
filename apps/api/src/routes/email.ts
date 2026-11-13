import type { FastifyInstance } from "fastify";
import { emailSignupInputSchema } from "@linux-statistics/shared";
import { addEmailSignup, listEmailSignups, type Database } from "@linux-statistics/db";
import { requireAdmin } from "../lib/session.js";

export function registerEmailRoutes(app: FastifyInstance, db: Database): void {
  app.post(
    "/api/email-signups",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req) => {
      // Invalid email throws ZodError -> mapped to 400 by the app error handler.
      const body = emailSignupInputSchema.parse(req.body);
      await addEmailSignup(db, body);
      // Always ok (new or duplicate) so subscriber membership isn't revealed.
      return { ok: true };
    },
  );

  app.get(
    "/api/admin/email-signups",
    { preHandler: requireAdmin(db) },
    async () => listEmailSignups(db),
  );

  // Same list as a CSV for Resend's contact import (Audience → Contacts → Import).
  app.get("/api/admin/email-signups.csv", { preHandler: requireAdmin(db) }, async (_req, reply) => {
    const rows = await listEmailSignups(db);
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
