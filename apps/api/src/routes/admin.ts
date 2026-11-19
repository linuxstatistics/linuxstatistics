import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ingestionSourceSchema } from "@linux-statistics/shared";
import {
  adminGaps,
  adminSummary,
  listContributions,
  quizStats,
  recentIngestionRuns,
  listForModeration,
  moderateContribution,
  type Database,
} from "@linux-statistics/db";
import { currentUser, requireAdmin } from "../lib/session.js";

const statusSchema = z.enum(["visible", "hidden", "removed"]);

export function registerAdminRoutes(app: FastifyInstance, db: Database): void {
  const admin = requireAdmin(db);

  app.get("/api/admin/contributions", { preHandler: admin }, async (req) => {
    const q = (req.query as { status?: string }).status;
    const status = q ? statusSchema.parse(q) : undefined;
    return listContributions(db, status);
  });

  app.get("/api/admin/summary", { preHandler: admin }, async () => adminSummary(db));

  app.get("/api/admin/quiz", { preHandler: admin }, async () => quizStats(db));

  app.get("/api/admin/gaps", { preHandler: admin }, async () => adminGaps(db));

  app.get("/api/admin/sources/:source/runs", { preHandler: admin }, async (req, reply) => {
    const parsed = ingestionSourceSchema.safeParse((req.params as { source: string }).source);
    if (!parsed.success) {
      reply.code(404);
      return { error: "unknown_source" };
    }
    return recentIngestionRuns(db, parsed.data);
  });

  app.get("/api/admin/ratings", { preHandler: admin }, async (req) => {
    const q = z.object({ status: z.enum(["visible", "hidden"]).optional() }).parse(req.query);
    return listForModeration(db, q.status);
  });

  // Hide only (no edit or delete). Hiding needs a reason; both actions are logged.
  app.patch("/api/admin/contributions/:id", { preHandler: admin }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      reply.code(400);
      return { error: "bad_id" };
    }
    const body = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("hide"), reason: z.string().trim().min(3).max(300) }),
        z.object({ action: z.literal("unhide") }),
      ])
      .parse(req.body);
    const adminUser = await currentUser(db, req);
    const changed = await moderateContribution(db, id, body.action, adminUser!.id, body.action === "hide" ? body.reason : undefined);
    if (!changed) {
      reply.code(409);
      return { error: "not_changed" };
    }
    return { ok: true };
  });
}
