import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { suggestionInputSchema } from "@linux-statistics/shared";
import { addSuggestion, listSuggestions, setSuggestionStatus, type Database } from "@linux-statistics/db";
import { currentUser, requireAdmin } from "../lib/session.js";

const statusSchema = z.enum(["new", "done", "dismissed"]);

export function registerSuggestionRoutes(app: FastifyInstance, db: Database): void {
  // Public: anyone can suggest; signed-in users are linked so admins can follow up.
  app.post(
    "/api/suggestions",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (req) => {
      const body = suggestionInputSchema.parse(req.body);
      // Honeypot filled: pretend success, store nothing.
      if (body.website) return { ok: true };
      const user = await currentUser(db, req);
      await addSuggestion(db, { ...body, subject: body.subject || null, email: body.email ?? null, userId: user?.id ?? null });
      return { ok: true };
    },
  );

  const admin = requireAdmin(db);
  app.get("/api/admin/suggestions", { preHandler: admin }, async (req) => {
    const q = z.object({ status: statusSchema.optional() }).parse(req.query);
    return listSuggestions(db, q.status);
  });
  app.patch("/api/admin/suggestions/:id", { preHandler: admin }, async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
    const { status } = z.object({ status: statusSchema }).parse(req.body);
    if (!(await setSuggestionStatus(db, id, status))) {
      reply.code(404);
      return { error: "not_found" };
    }
    return { ok: true };
  });
}
