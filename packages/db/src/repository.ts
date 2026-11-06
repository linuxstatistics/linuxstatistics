import { and, eq } from "drizzle-orm";
import type { DistroInput, IngestionSource, IngestionStatus, Period, PopularitySource } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import {
  distroAliases,
  distros,
  popularitySnapshots,
  githubRepos,
  githubSnapshots,
  marketShare,
  ingestionRuns,
} from "./schema.js";

/** Insert or update a distro by slug. Returns its id. */
export async function upsertDistro(db: Database, input: DistroInput): Promise<number> {
  const values = {
    slug: input.slug,
    name: input.name,
    family: input.family,
    basedOnSlug: input.basedOnSlug ?? null,
    homepage: input.homepage ?? null,
    logoUrl: input.logoUrl ?? null,
    firstReleaseYear: input.firstReleaseYear ?? null,
    status: input.status,
  };
  const [row] = await db
    .insert(distros)
    .values(values)
    .onConflictDoUpdate({ target: distros.slug, set: values })
    .returning({ id: distros.id });
  return row!.id;
}

export async function addPopularitySnapshot(
  db: Database,
  distroId: number,
  s: { source: PopularitySource; capturedAt: Date; rank: number; hitsPerDay: number; period: Period },
): Promise<void> {
  await db.insert(popularitySnapshots).values({ distroId, ...s });
}

export async function upsertGithubRepo(
  db: Database,
  distroId: number,
  r: { repoFullName: string; stars: number; forks: number; openIssues: number },
): Promise<number> {
  const [row] = await db
    .insert(githubRepos)
    .values({ distroId, ...r })
    .onConflictDoUpdate({
      target: githubRepos.repoFullName,
      set: { distroId, stars: r.stars, forks: r.forks, openIssues: r.openIssues },
    })
    .returning({ id: githubRepos.id });
  return row!.id;
}

export async function addGithubSnapshot(
  db: Database,
  repoId: number,
  s: { capturedAt: Date; stars: number; commitsLast30d: number; contributors: number },
): Promise<void> {
  await db.insert(githubSnapshots).values({ repoId, ...s });
}

/** Insert or replace one month's share for a region and platform. */
export async function upsertMarketShare(
  db: Database,
  m: {
    capturedAt: Date;
    region: string;
    platform: "linux" | "windows" | "macos" | "other";
    sharePct: number;
  },
): Promise<void> {
  const sharePct = m.sharePct.toFixed(3);
  await db
    .insert(marketShare)
    .values({ ...m, sharePct })
    .onConflictDoUpdate({
      target: [marketShare.region, marketShare.platform, marketShare.capturedAt],
      set: { sharePct },
    });
}

export async function addMarketShare(
  db: Database,
  m: {
    capturedAt: Date;
    region: string;
    platform: "linux" | "windows" | "macos" | "other";
    sharePct: number;
  },
): Promise<void> {
  await db.insert(marketShare).values({ ...m, sharePct: m.sharePct.toFixed(3) });
}

/** Record a completed ingestion run for freshness reporting. */
export async function recordIngestionRun(
  db: Database,
  source: IngestionSource,
  status: IngestionStatus,
  rowsWritten: number,
  error?: string,
): Promise<void> {
  await db.insert(ingestionRuns).values({
    source,
    status,
    rowsWritten,
    error: error ?? null,
    finishedAt: new Date(),
  });
}

/** Resolve a distro id from its slug, if it exists. */
export async function findDistroIdBySlug(
  db: Database,
  slug: string,
): Promise<number | null> {
  const [row] = await db
    .select({ id: distros.id })
    .from(distros)
    .where(eq(distros.slug, slug));
  return row?.id ?? null;
}

export type AliasSource = "distrowatch" | "legacy";

/** Record another name for a distro (idempotent; re-points an existing alias). */
export async function addAlias(
  db: Database,
  source: AliasSource,
  alias: string,
  distroId: number,
): Promise<void> {
  await db
    .insert(distroAliases)
    .values({ source, alias, distroId })
    .onConflictDoUpdate({
      target: [distroAliases.source, distroAliases.alias],
      set: { distroId },
    });
}

/** Resolve a distro id from an alias, if known. */
export async function findDistroIdByAlias(
  db: Database,
  source: AliasSource,
  alias: string,
): Promise<number | null> {
  const [row] = await db
    .select({ id: distroAliases.distroId })
    .from(distroAliases)
    .where(and(eq(distroAliases.source, source), eq(distroAliases.alias, alias)));
  return row?.id ?? null;
}

/** Families and bases set by hand; only these overwrite an existing value. */
export async function setDistroFamily(
  db: Database,
  distroId: number,
  family: DistroInput["family"],
  basedOnSlug: string | null,
): Promise<void> {
  await db.update(distros).set({ family, basedOnSlug }).where(eq(distros.id, distroId));
}

/**
 * Make `repo` the only tracked repository for a distro (drops a stale mapping,
 * e.g. after a repo moved), then record a snapshot.
 */
export async function replaceGithubRepo(
  db: Database,
  distroId: number,
  r: { repoFullName: string; stars: number; forks: number; openIssues: number },
  snap: { capturedAt: Date; commitsLast30d: number; contributors: number },
): Promise<void> {
  await db.delete(githubRepos).where(eq(githubRepos.distroId, distroId));
  const repoId = await upsertGithubRepo(db, distroId, r);
  await addGithubSnapshot(db, repoId, { capturedAt: snap.capturedAt, stars: r.stars, commitsLast30d: snap.commitsLast30d, contributors: snap.contributors });
}
