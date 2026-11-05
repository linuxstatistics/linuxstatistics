import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import secureSession from "@fastify/secure-session";
import { findUserById, type Database, type UserRow } from "@linux-statistics/db";

const DEV_SECRET = "dev-only-session-secret-change-me-32b!!";

/** Resolve the session secret; production must set SESSION_SECRET explicitly. */
export function resolveSessionSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.SESSION_SECRET ?? (env.NODE_ENV === "production" ? undefined : DEV_SECRET);
  if (!secret) throw new Error("SESSION_SECRET is required in production");
  return secret;
}

/**
 * Dev login lets anyone sign in as anyone (and pick a role). Refuse to run
 * with it in production so a stray env var can't open the site.
 */
export function assertNoDevLoginInProduction(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === "production" && env.ALLOW_DEV_LOGIN === "1") {
    throw new Error("ALLOW_DEV_LOGIN=1 is not allowed when NODE_ENV=production");
  }
}

/** Register the signed, httpOnly session cookie. */
export async function registerSession(app: FastifyInstance): Promise<void> {
  assertNoDevLoginInProduction();
  const secret = resolveSessionSecret();
  if (secret.length < 32) throw new Error("SESSION_SECRET must be >= 32 chars");
  await app.register(secureSession, {
    secret,
    salt: "linuxstats-sess1",
    cookieName: "ls_session",
    cookie: { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  });
}

/** Load the current user from the session, or null. */
export async function currentUser(db: Database, req: FastifyRequest): Promise<UserRow | null> {
  const id = req.session.get("userId");
  if (typeof id !== "number") return null;
  return findUserById(db, id);
}

/** preHandler: 401 unless authenticated; attaches req.authUser. */
export function requireUser(db: Database) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await currentUser(db, req);
    if (!user) {
      reply.code(401);
      return reply.send({ error: "unauthorized" });
    }
    (req as FastifyRequest & { authUser: UserRow }).authUser = user;
  };
}

/** preHandler: 403 unless authenticated admin. */
export function requireAdmin(db: Database) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await currentUser(db, req);
    if (!user) {
      reply.code(401);
      return reply.send({ error: "unauthorized" });
    }
    if (user.role !== "admin") {
      reply.code(403);
      return reply.send({ error: "forbidden" });
    }
    (req as FastifyRequest & { authUser: UserRow }).authUser = user;
  };
}
