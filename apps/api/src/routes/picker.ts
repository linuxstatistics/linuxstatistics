import type { FastifyInstance } from "fastify";
import { pickerFeedbackInputSchema } from "@linux-statistics/shared";
import { addPickerFeedback, listPickerFeedback, type Database } from "@linux-statistics/db";
import { requireAdmin } from "../lib/session.js";

export function registerPickerRoutes(app: FastifyInstance, db: Database): void {
  // Public and anonymous: no session, nothing about the visitor is stored.
  app.post(
    "/api/picker-feedback",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    async (req) => {
      const body = pickerFeedbackInputSchema.parse(req.body);
      if (body.website) return { ok: true };
      await addPickerFeedback(db, { topKey: body.topKey, code: body.code, fit: body.fit });
      return { ok: true };
    },
  );

  app.get("/api/admin/picker-feedback.csv", { preHandler: requireAdmin(db) }, async (_req, reply) => {
    const rows = await listPickerFeedback(db);
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="picker-feedback.csv"');
    return ["id,day,top_key,code,fit", ...rows.map((r) => `${r.id},${r.day},${r.topKey},${r.code},${r.fit ? 1 : 0}`)].join("\n") + "\n";
  });
}
