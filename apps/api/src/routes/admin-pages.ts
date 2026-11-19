import { readFile, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { Database } from "@linux-statistics/db";
import { currentUser } from "../lib/session.js";

/**
 * Admin pages are built like the rest of the site, but production never
 * publishes them as static files: the build moves them to `dir`, and this
 * route serves them to admins only. Everyone else gets the site's normal 404,
 * so the pages don't reveal that they exist. Off when `dir` is unset (local
 * dev serves /admin/ from the Astro dev server).
 */
export function registerAdminPages(app: FastifyInstance, db: Database, dir: string | undefined): void {
  if (!dir) return;
  const root = resolve(dir);

  const notFound = async (reply: FastifyReply) => {
    const page = await readFile(join(root, "_404.html"), "utf8").catch(() => "Not found");
    return reply.code(404).header("Content-Type", "text/html; charset=utf-8").header("Cache-Control", "no-store").send(page);
  };

  const handler = async (req: { url: string }, reply: FastifyReply) => {
    const user = await currentUser(db, req as never);
    if (user?.role !== "admin") return notFound(reply);
    const path = decodeURIComponent(req.url.split("?")[0]!).replace(/^\/admin\/?/, "");
    let file = resolve(root, path);
    if (file !== root && !file.startsWith(root + sep)) return notFound(reply);
    if (path.startsWith("_")) return notFound(reply);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      file = join(file, "index.html");
    }
    const body = await readFile(file).catch(() => null);
    if (!body || !file.endsWith(".html")) return notFound(reply);
    return reply
      .header("Content-Type", "text/html; charset=utf-8")
      .header("Cache-Control", "private, no-store")
      .header("X-Robots-Tag", "noindex, nofollow")
      .send(body);
  };

  app.get("/admin", handler);
  app.get("/admin/*", handler);
}
