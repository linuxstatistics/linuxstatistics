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
}
