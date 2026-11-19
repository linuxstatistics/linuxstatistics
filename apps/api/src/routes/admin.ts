import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ingestionSourceSchema } from "@linux-statistics/shared";
import {
  adminGaps,
  adminSummary,
  listContributions,
  quizStats,
  recentIngestionRuns,
  setContributionStatusById,
  type Database,
} from "@linux-statistics/db";
import { requireAdmin } from "../lib/session.js";

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

  app.patch("/api/admin/contributions/:id", { preHandler: admin }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      reply.code(400);
      return { error: "bad_id" };
    }
    const { status } = z.object({ status: statusSchema }).parse(req.body);
    await setContributionStatusById(db, id, status);
    return { ok: true };
  });
}
