import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  findDistroIdBySlug,
  upsertContribution,
  softRemoveContribution,
  type Database,
  type UserRow,
} from "@linux-statistics/db";
import { requireUser } from "../lib/session.js";

const MIN_ACCOUNT_AGE_MS = 30 * 24 * 3600 * 1000;

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5).nullable(),
  usesIt: z.boolean(),
  reviewBody: z.string().max(1000).nullable(),
});

export function registerContributionRoutes(app: FastifyInstance, db: Database): void {
  const auth = requireUser(db);
  const rateLimit = { max: 20, timeWindow: "1 minute" };

  app.put(
    "/api/distros/:slug/contribution",
    { preHandler: auth, config: { rateLimit } },
    async (req, reply) => {
      const user = (req as typeof req & { authUser: UserRow }).authUser;
      // account-age gate
      const created = user.accountCreatedAt?.getTime() ?? 0;
      if (Date.now() - created < MIN_ACCOUNT_AGE_MS) {
        reply.code(403);
        return { error: "account_too_new" };
      }
      const body = bodySchema.parse(req.body);
      if (body.rating == null && !body.usesIt && !body.reviewBody) {
        reply.code(400);
        return { error: "empty_contribution" };
      }
      const distroId = await findDistroIdBySlug(db, (req.params as { slug: string }).slug);
      if (distroId == null) {
        reply.code(404);
        return { error: "not_found" };
      }
      await upsertContribution(db, { userId: user.id, distroId, ...body });
      return { ok: true };
    },
  );

  app.delete(
    "/api/distros/:slug/contribution",
    { preHandler: auth, config: { rateLimit } },
    async (req, reply) => {
      const user = (req as typeof req & { authUser: UserRow }).authUser;
      const distroId = await findDistroIdBySlug(db, (req.params as { slug: string }).slug);
      if (distroId == null) {
        reply.code(404);
        return { error: "not_found" };
      }
      await softRemoveContribution(db, user.id, distroId);
      return { ok: true };
    },
  );
}
