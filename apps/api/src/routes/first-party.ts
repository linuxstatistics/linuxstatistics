import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { quizCompletionInputSchema, switchReportInputSchema } from "@linux-statistics/shared";
import {
  addQuizCompletion,
  addSwitchReport,
  listQuizCompletions,
  listSwitchReports,
  removeQuizCompletion,
  type Database,
} from "@linux-statistics/db";
import { requireAdmin } from "../lib/session.js";
import { isBotUserAgent } from "./interest.js";

/** Browsers that send Global Privacy Control have opted out; nothing is stored for them. */
const gpcOptOut = (h: Record<string, unknown>) => h["sec-gpc"] === "1";

const csv = (header: string, rows: (string | number | null)[][]) =>
  [header, ...rows.map((r) => r.map((v) => (v == null ? "" : String(v))).join(","))].join("\n") + "\n";

/**
 * Anonymous first-party counters: finished quizzes and "helped me switch"
 * reports. Nothing about the visitor is stored; the IP is only used by the
 * rate limiter in memory.
 */
export function registerFirstPartyRoutes(app: FastifyInstance, db: Database): void {
  app.post(
    "/api/quiz-completions",
    { config: { rateLimit: { max: 20, timeWindow: "10 minutes" } } },
    async (req, reply) => {
      const body = quizCompletionInputSchema.parse(req.body);
      reply.code(204);
      if (body.website || gpcOptOut(req.headers) || isBotUserAgent(req.headers["user-agent"])) return;
      await addQuizCompletion(db, body);
    },
  );

  app.delete(
    "/api/quiz-completions/:token",
    { config: { rateLimit: { max: 20, timeWindow: "10 minutes" } } },
    async (req, reply) => {
      const { token } = z.object({ token: z.uuid() }).parse(req.params);
      await removeQuizCompletion(db, token);
      reply.code(204);
    },
  );

  app.post(
    "/api/switch-reports",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const body = switchReportInputSchema.parse(req.body);
      reply.code(204);
      if (body.website || isBotUserAgent(req.headers["user-agent"])) return;
      await addSwitchReport(db, body);
    },
  );

  app.get("/api/admin/quiz-completions.csv", { preHandler: requireAdmin(db) }, async (_req, reply) => {
    const rows = await listQuizCompletions(db);
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="quiz-completions.csv"');
    return csv("id,day,quiz,code,top_key", rows.map((r) => [r.id, r.day, r.quiz, r.code, r.topKey]));
  });

  app.get("/api/admin/switch-reports.csv", { preHandler: requireAdmin(db) }, async (_req, reply) => {
    const rows = await listSwitchReports(db);
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="switch-reports.csv"');
    return csv("id,day,came_from,now_using,page", rows.map((r) => [r.id, r.day, r.cameFrom, r.nowUsing, r.page]));
  });
}
