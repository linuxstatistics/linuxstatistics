import { eq } from "drizzle-orm";
import type { DistroInput, IngestionSource, IngestionStatus } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import {
  distros,
  distrowatchSnapshots,
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

export async function addDistrowatchSnapshot(
  db: Database,
  distroId: number,
  s: { capturedAt: Date; rank: number; hitsPerDay: number; period: string },
): Promise<void> {
  await db.insert(distrowatchSnapshots).values({ distroId, ...s });
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
