import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  listContributions,
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
