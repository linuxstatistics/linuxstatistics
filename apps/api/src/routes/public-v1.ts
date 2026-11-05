import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { getDistroDetail, getMarketShare, resolveSlug, type Database } from "@linux-statistics/db";
import type { DistroDetail, DistroListItem } from "@linux-statistics/shared";

/** Public, stable v1: read-only, open CORS, cacheable, rate-limited, no cookies. */
const rateLimit = { max: 120, timeWindow: "1 minute" };
const LICENSE = { license: "CC-BY-4.0", credit: "Data: LinuxStatistics (linuxstatistics.com), CC BY 4.0" };

function publicHeaders(reply: FastifyReply) {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.removeHeader("Access-Control-Allow-Credentials");
  reply.header("Cache-Control", "public, max-age=300");
  reply.header("X-Data-License", LICENSE.license);
}

/** Public detail: drop the per-user field. */
function publicDetail(d: DistroDetail) {
  const { myContribution: _mine, ...rest } = d;
  return rest;
}

export function registerPublicV1(app: FastifyInstance, db: Database, list: () => Promise<DistroListItem[]>): void {
  app.get("/api/v1/distros", { config: { rateLimit } }, async (_req, reply) => {
    publicHeaders(reply);
    return { ...LICENSE, data: await list() };
  });

  app.get("/api/v1/distros/:slug", { config: { rateLimit } }, async (req, reply) => {
    publicHeaders(reply);
    const { slug } = z.object({ slug: z.string().min(1).max(100) }).parse(req.params);
    const canonical = await resolveSlug(db, slug);
    if (canonical && canonical !== slug) return reply.redirect(`/api/v1/distros/${encodeURIComponent(canonical)}`, 301);
    const detail = await getDistroDetail(db, slug);
    if (!detail) {
      reply.code(404);
      return { error: "not_found" };
    }
    return { ...LICENSE, data: publicDetail(detail) };
  });

  app.get("/api/v1/market-share", { config: { rateLimit } }, async (req, reply) => {
    publicHeaders(reply);
    const q = z.object({ region: z.string().max(32).optional() }).parse(req.query);
    return { ...LICENSE, data: await getMarketShare(db, { region: q.region }) };
  });
}
