import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import {
  getDistroDetail,
  getRising,
  resolveSlug,
  getDistroList,
  getGalaxy,
  getMarketShare,
  getMeta,
  type Database,
} from "@linux-statistics/db";
import { currentUser, registerSession } from "./lib/session.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerContributionRoutes } from "./routes/contributions.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerEmailRoutes } from "./routes/email.js";
import { registerSuggestionRoutes } from "./routes/suggestions.js";
import { registerPublicV1 } from "./routes/public-v1.js";

/** Tiny in-memory TTL cache for hot, argument-free queries. */
function ttlCache<T>(ttlMs: number, fn: () => Promise<T>): () => Promise<T> {
  let value: T | undefined;
  let expiresAt = 0;
  return async () => {
    const now = Date.now();
    if (value !== undefined && now < expiresAt) return value;
    value = await fn();
    expiresAt = now + ttlMs;
    return value;
  };
}

const marketQuerySchema = z.object({
  region: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function buildApp(db: Database): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: process.env.WEB_ORIGIN ?? true, credentials: true });
  await registerSession(app);
  await app.register(rateLimit, { global: false });

  const TTL = Number(process.env.API_CACHE_TTL_MS ?? 15_000);
  const distrosCached = ttlCache(TTL, () => getDistroList(db));
  const galaxyCached = ttlCache(TTL, () => getGalaxy(db));
  const metaCached = ttlCache(TTL, () => getMeta(db));
  const risingCached = ttlCache(TTL, () => getRising(db));

  app.get("/health", async () => ({ ok: true }));

  app.get("/api/distros", async () => distrosCached());

  app.get("/api/galaxy", async () => galaxyCached());

  app.get("/api/meta", async () => metaCached());

  app.get("/api/rising", async () => risingCached());

  app.get("/api/market-share", async (req) => {
    const q = marketQuerySchema.parse(req.query);
    return getMarketShare(db, {
      region: q.region,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
  });

  app.get("/api/distros/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const canonical = await resolveSlug(db, slug);
    if (canonical && canonical !== slug) {
      return reply.redirect(`/api/distros/${encodeURIComponent(canonical)}`, 301);
    }
    const user = await currentUser(db, req);
    const detail = await getDistroDetail(db, slug, user?.id);
    if (!detail) {
      reply.code(404);
      return { error: "not_found", message: `No distro with slug '${slug}'` };
    }
    return detail;
  });

  registerAuthRoutes(app, db);
  registerContributionRoutes(app, db);
  registerAdminRoutes(app, db);
  registerEmailRoutes(app, db);
  registerSuggestionRoutes(app, db);
  registerPublicV1(app, db, distrosCached);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof z.ZodError) {
      reply.code(400);
      return reply.send({ error: "bad_request", details: z.flattenError(err) });
    }
    app.log.error(err);
    reply.code(503);
    return reply.send({ error: "unavailable", message: "data temporarily unavailable" });
  });

  return app;
}
