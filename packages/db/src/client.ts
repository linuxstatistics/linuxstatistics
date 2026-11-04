import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/**
 * The app standardizes on PGlite (in-process Postgres) for local dev and tests,
 * because host->container Postgres is not reachable in this environment.
 * `Database` is the PGlite-backed Drizzle type that repository functions accept.
 * `createPostgresDb` remains available for real production deployments.
 */
export type Database = PgliteDatabase<typeof schema>;

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
export async function runMigrations(db: Database) {
  await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

/** Create and migrate a PGlite database in one call. */
export async function initPgliteDb(dataDir?: string) {
  const { db, client } = createPgliteDb(dataDir);
  await runMigrations(db);
  return { db, client };
}

/** Production driver: postgres-js over a real Postgres server. */
export function createPostgresDb(connectionString: string) {
  const sql = postgres(connectionString, { max: 10 });
  const db = drizzlePostgres(sql, { schema });
  return { db, sql };
}
