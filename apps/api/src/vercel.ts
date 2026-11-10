import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { openDb } from "@linux-statistics/db";
import { buildApp } from "./app.js";

/**
 * Vercel Function entry: one Fastify app per warm instance, reused across
 * requests. Migrations run in the build and the data job, not here.
 */
let ready: Promise<FastifyInstance> | undefined;

function app(): Promise<FastifyInstance> {
  ready ??= (async () => {
    const { db } = await openDb({ max: 1, migrate: false });
    const a = await buildApp(db);
    await a.ready();
    return a;
  })().catch((err) => {
    ready = undefined;
    throw err;
  });
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const a = await app();
  a.server.emit("request", req, res);
}
