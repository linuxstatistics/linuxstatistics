import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { affiliateClickTotals, compareRankSources, countAffiliateClick, countPageView, findDistroIdBySlug, type Database } from "@linux-statistics/db";
import { affiliatePartner } from "@linux-statistics/shared";
import { requireAdmin } from "../lib/session.js";

/** Crawlers, link previews and monitoring: their views don't count. */
const BOT_UA = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|curl|wget|python|httpclient|java\/|go-http/i;

export function isBotUserAgent(ua: string | undefined): boolean {
  return !ua || BOT_UA.test(ua);
}

export function registerInterestRoutes(app: FastifyInstance, db: Database): void {
  // Anonymous view counter for our own distro pages. Nothing about the visitor
  // is stored: one counter per distro per UTC day goes up by one.
  app.post(
    "/api/views/:slug",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req, reply) => {
      reply.code(204);
      if (isBotUserAgent(req.headers["user-agent"])) return;
      const { slug } = z.object({ slug: z.string().min(1).max(100) }).parse(req.params);
      const id = await findDistroIdBySlug(db, slug);
      if (id != null) await countPageView(db, id, new Date().toISOString().slice(0, 10));
    },
  );

  // Affiliate redirect: count the click (partner + UTC day only, nothing about
  // the visitor), then send the browser to the partner's referral URL.
  app.get(
    "/api/go/:partner",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const { partner } = z.object({ partner: z.string().min(1).max(40) }).parse(req.params);
      const p = affiliatePartner(partner);
      if (!p) return reply.code(404).send({ error: "unknown partner" });
      if (!isBotUserAgent(req.headers["user-agent"])) await countAffiliateClick(db, p.slug, new Date().toISOString().slice(0, 10));
      reply.header("Cache-Control", "no-store");
      reply.header("Referrer-Policy", "no-referrer");
      return reply.redirect(p.href, 302);
    },
  );

  app.get("/api/admin/affiliate-clicks", { preHandler: requireAdmin(db) }, async () => affiliateClickTotals(db));

  // Shadow period: our index next to the current main rank.
  app.get("/api/admin/rank-compare", { preHandler: requireAdmin(db) }, async () => compareRankSources(db, "distrowatch", "interest"));
}
