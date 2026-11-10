import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema.js";

/**
 * Local dev and tests use PGlite (in-process Postgres); production uses a real
 * Postgres via DATABASE_URL. `Database` is the driver-neutral Drizzle type that
 * repository and query functions accept.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export const MIGRATIONS_FOLDER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../drizzle",
);

// Repo root, resolved relative to this file (packages/db/src) so it is stable
// regardless of the process working directory.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * The PGlite data directory used by both the seed script and the API, so they
 * read/write the same local database. Override with PGLITE_DIR (absolute or
 * relative to cwd); otherwise it is an absolute path under the repo root.
 */
export function defaultPgliteDir(): string {
  return process.env.PGLITE_DIR ?? resolve(REPO_ROOT, ".data/pglite");
}

/**
 * PGlite-backed database. Pass a directory for a persisted DB, or omit for an
 * ephemeral in-memory DB (used by tests).
 */
export function createPgliteDb(dataDir?: string) {
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  return { db, client };
}

/** Apply drizzle-kit SQL migrations to a PGlite database. */
export async function runMigrations(db: ReturnType<typeof createPgliteDb>["db"]) {
  await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

/** Create and migrate a PGlite database in one call. */
export async function initPgliteDb(dataDir?: string) {
  const { db, client } = createPgliteDb(dataDir);
  await runMigrations(db);
  return { db, client };
}

/**
 * Production driver: postgres-js over a real Postgres server. A pooled URL
 * (PgBouncer in transaction mode, e.g. Neon's "-pooler" host) can't keep
 * prepared statements between transactions, so they're turned off there.
 */
export function createPostgresDb(connectionString: string, max = 10) {
  const sql = postgres(connectionString, { max, prepare: !isPooledUrl(connectionString), onnotice: () => {} });
  const db = drizzlePostgres(sql, { schema });
  return { db, sql };
}

export function isPooledUrl(connectionString: string): boolean {
  try {
    return new URL(connectionString).hostname.includes("-pooler");
  } catch {
    return false;
  }
}

/**
 * The Postgres URL to use, or undefined for local PGlite. Production must use
 * Postgres: a PGlite folder on a server or serverless host is lost on redeploy,
 * and with it every vote, rating and signup.
 */
export function databaseUrlFor(env: NodeJS.ProcessEnv): string | undefined {
  const url = env.DATABASE_URL || undefined;
  if (!url && env.NODE_ENV === "production") throw new Error("DATABASE_URL is required in production");
  return url;
}

/**
 * Open the app database: Postgres when DATABASE_URL is set (production; many
 * processes can share it), otherwise the local PGlite dir. Migrations run on
 * open unless `migrate: false` (serverless functions, where the build and the
 * data job migrate instead). `close()` releases the connection.
 */
export async function openDb(opts: { max?: number; migrate?: boolean } = {}): Promise<{
  db: Database;
  close: () => Promise<void>;
  kind: "postgres" | "pglite";
}> {
  const url = databaseUrlFor(process.env);
  if (url) {
    const { db, sql } = createPostgresDb(url, opts.max);
    if (opts.migrate !== false) await migratePostgres(db, { migrationsFolder: MIGRATIONS_FOLDER });
    return { db, close: () => sql.end(), kind: "postgres" };
  }
  const { db, client } = await initPgliteDb(defaultPgliteDir());
  return { db, close: () => client.close(), kind: "pglite" };
}
