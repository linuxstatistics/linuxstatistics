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

export interface DistroRow {
  id: number;
  slug: string;
  name: string;
  family: DistroInput["family"];
  basedOnSlug: string | null;
  homepage: string | null;
  firstReleaseYear: number | null;
}

/** The fields a source may fill in, for one distro. */
export async function getDistroRow(db: Database, id: number): Promise<DistroRow | null> {
  const [row] = await db
    .select({
      id: distros.id,
      slug: distros.slug,
      name: distros.name,
      family: distros.family,
      basedOnSlug: distros.basedOnSlug,
      homepage: distros.homepage,
      firstReleaseYear: distros.firstReleaseYear,
    })
    .from(distros)
    .where(eq(distros.id, id));
  return row ?? null;
}

/**
 * Fill only empty fields; a value that's already set (curated or from an
 * earlier source) is never overwritten. Returns the fields it filled.
 */
export async function fillDistroBlanks(
  db: Database,
  id: number,
  f: { basedOnSlug?: string | null; homepage?: string | null; firstReleaseYear?: number | null },
): Promise<string[]> {
  const row = await getDistroRow(db, id);
  if (!row) return [];
  const set: Partial<Pick<DistroRow, "basedOnSlug" | "homepage" | "firstReleaseYear">> = {};
  if (row.basedOnSlug == null && f.basedOnSlug) set.basedOnSlug = f.basedOnSlug;
  if (row.homepage == null && f.homepage) set.homepage = f.homepage;
  if (row.firstReleaseYear == null && f.firstReleaseYear != null) set.firstReleaseYear = f.firstReleaseYear;
  const keys = Object.keys(set);
  if (keys.length) await db.update(distros).set(set).where(eq(distros.id, id));
  return keys;
}

/** Create a distro that a source found on its own; it stays unlisted until it has a signal. */
export async function insertDiscoveredDistro(
  db: Database,
  input: DistroInput,
  discoveredVia: string,
): Promise<number> {
  const [row] = await db
    .insert(distros)
    .values({
      slug: input.slug,
      name: input.name,
      family: input.family,
      basedOnSlug: input.basedOnSlug ?? null,
      homepage: input.homepage ?? null,
      firstReleaseYear: input.firstReleaseYear ?? null,
      status: input.status,
      discoveredVia,
    })
    .returning({ id: distros.id });
  return row!.id;
}

/** A distro's slug from its id, if it exists. */
export async function findDistroSlugById(db: Database, id: number): Promise<string | null> {
  const [row] = await db.select({ slug: distros.slug }).from(distros).where(eq(distros.id, id));
  return row?.slug ?? null;
}

/** Where an alias comes from: another site's ID for the distro, or one of our old slugs. */
export type AliasSource = "distrowatch" | "wikidata" | "legacy";

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

/** All aliases recorded for a distro. */
export async function aliasesFor(db: Database, distroId: number): Promise<{ source: string; alias: string }[]> {
  return db
    .select({ source: distroAliases.source, alias: distroAliases.alias })
    .from(distroAliases)
    .where(eq(distroAliases.distroId, distroId));
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
