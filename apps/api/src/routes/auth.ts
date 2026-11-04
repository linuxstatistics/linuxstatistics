import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { upsertUser, type AuthProvider, type Database } from "@linux-statistics/db";
import { currentUser } from "../lib/session.js";
import {
  authorizeRedirect,
  buildProviderRegistry,
  type NormalizedProfile,
  type ProviderConfig,
  type ProviderRegistry,
} from "../lib/oauth/providers.js";
import { exchangeCode, fetchProfile } from "../lib/oauth/flow.js";

/** Resolve a code to a normalized profile. Injectable so tests skip the network. */
export type ExchangeFn = (
  p: ProviderConfig,
  code: string,
  redirectUri: string,
) => Promise<NormalizedProfile>;

const devLoginSchema = z.object({
  provider: z.enum(["github", "gitlab", "codeberg"]).optional(),
  providerUserId: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable().optional(),
  accountCreatedAt: z.string().nullable().optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export function registerAuthRoutes(
  app: FastifyInstance,
  db: Database,
  opts: { registry?: ProviderRegistry; exchange?: ExchangeFn } = {},
): void {
  const registry = opts.registry ?? buildProviderRegistry();
  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:4380";
  const apiPublicUrl = process.env.API_PUBLIC_URL ?? "http://localhost:3001";
  const exchange: ExchangeFn =
    opts.exchange ??
    (async (p, code, redirectUri) => fetchProfile(p, await exchangeCode(p, code, redirectUri)));

  const callbackUrl = (slug: AuthProvider) => `${apiPublicUrl}/api/auth/${slug}/callback`;

  app.get("/api/auth/providers", async () => {
    const list: Array<{ slug: string; displayName: string }> = [...registry.values()].map((p) => ({
      slug: p.slug,
      displayName: p.displayName,
    }));
    if (process.env.ALLOW_DEV_LOGIN === "1") list.push({ slug: "dev", displayName: "Dev login" });
    return list;
  });

  app.get("/api/auth/:provider", async (req, reply) => {
    const slug = (req.params as { provider: string }).provider as AuthProvider;
    const provider = registry.get(slug);
    if (!provider) {
      reply.code(404);
      return { error: "unknown_provider" };
    }
    const state = randomUUID();
    req.session.set("oauthState", state);
    return reply.redirect(authorizeRedirect(provider, callbackUrl(slug), state));
  });

  app.get("/api/auth/:provider/callback", async (req, reply) => {
    const slug = (req.params as { provider: string }).provider as AuthProvider;
    const provider = registry.get(slug);
    if (!provider) {
      reply.code(404);
      return { error: "unknown_provider" };
    }
    const q = req.query as { code?: string; state?: string };
    if (!q.code) {
      reply.code(400);
      return { error: "missing_code" };
    }
    const expected = req.session.get("oauthState");
    if (!expected || !q.state || q.state !== expected) {
      reply.code(400);
      return { error: "bad_state" };
    }
    // single-use: invalidate the state so a callback can't be replayed
    req.session.set("oauthState", "");
    const profile = await exchange(provider, q.code, callbackUrl(slug));
    const user = await upsertUser(db, profile);
    req.session.set("userId", user.id);
    return reply.redirect(webOrigin);
  });

  app.post("/api/auth/logout", async (req) => {
    req.session.delete();
    return { ok: true };
  });

  app.get("/api/me", async (req, reply) => {
    const user = await currentUser(db, req);
    if (!user) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    return {
      id: user.id,
      provider: user.provider,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  });

  if (process.env.ALLOW_DEV_LOGIN === "1") {
    app.post("/api/auth/dev-login", async (req) => {
      const b = devLoginSchema.parse(req.body);
      const user = await upsertUser(db, {
        provider: b.provider ?? "github",
        providerUserId: b.providerUserId,
        username: b.username,
        avatarUrl: b.avatarUrl ?? null,
        accountCreatedAt: b.accountCreatedAt ? new Date(b.accountCreatedAt) : new Date("2015-01-01"),
      });
      if (b.role) {
        const { schema } = await import("@linux-statistics/db");
        const { eq } = await import("drizzle-orm");
        await db.update(schema.users).set({ role: b.role }).where(eq(schema.users.id, user.id));
      }
      req.session.set("userId", user.id);
      return { ok: true, id: user.id };
    });
  }
}
