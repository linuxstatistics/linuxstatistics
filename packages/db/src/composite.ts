import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "./client.js";
import { distros, githubRepos, githubSnapshots, popularitySnapshots } from "./schema.js";
import { getDistroList } from "./queries.js";
import { pageViewsSince } from "./interest.js";

/**
 * Our composite index: one rank from several interest signals, so no single
 * third-party source decides the chart. Each input becomes a 0..1 score by
 * rank position (1 = best) over the distros it covers; inputs a distro lacks
 * score 0. The weighted sum is ranked. Weights and the method are published on
 * /about/. Changing WEIGHTS changes the chart; do it in a reviewed commit.
 */
export const COMPOSITE_WEIGHTS = {
  /** English Wikipedia article views per day, last 12 months (our "interest" index). */
  interest: 0.5,
  /** DistroWatch 12-month page-hit rank, a small credited input while our own signals grow. */
  distrowatch: 0.3,
  /** GitHub stars of the main repo, for distros with one. */
  github: 0.1,
  /** Views of the distro's page on this site over the last 90 days. */
  siteViews: 0.1,
} as const;

export type CompositeInput = keyof typeof COMPOSITE_WEIGHTS;

export interface CompositeRow {
  distroId: number;
  score: number;
  rank: number;
  /** Which inputs contributed. */
  inputs: CompositeInput[];
}

/** 1 for rank 1, falling linearly to just above 0 for the last ranked distro. */
export function rankScore(rank: number, total: number): number {
  if (total <= 1) return 1;
  return 1 - (rank - 1) / total;
}

/**
 * Pure scoring. `ranks[input]` maps distroId -> rank within that input (1 = best).
 * Only `listedIds` are ranked (the public catalogue), so ranks have no gaps.
 */
export function compositeRanks(
  listedIds: Iterable<number>,
  ranks: Partial<Record<CompositeInput, Map<number, number>>>,
  weights: Record<CompositeInput, number> = COMPOSITE_WEIGHTS,
): CompositeRow[] {
  const totals = Object.fromEntries(Object.entries(ranks).map(([k, m]) => [k, m?.size ?? 0])) as Record<CompositeInput, number>;
  const rows: Omit<CompositeRow, "rank">[] = [];
  for (const distroId of listedIds) {
    let score = 0;
    const inputs: CompositeInput[] = [];
    for (const key of Object.keys(weights) as CompositeInput[]) {
      const r = ranks[key]?.get(distroId);
      if (r == null) continue;
      score += weights[key] * rankScore(r, totals[key]);
      inputs.push(key);
    }
    if (inputs.length === 0) continue;
    rows.push({ distroId, score, inputs });
  }
  rows.sort((a, b) => b.score - a.score || a.distroId - b.distroId);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

async function latestRanks(db: Database, source: string, period: string): Promise<Map<number, number>> {
  const [latest] = await db
    .select({ capturedAt: popularitySnapshots.capturedAt })
    .from(popularitySnapshots)
    .where(and(eq(popularitySnapshots.source, source), eq(popularitySnapshots.period, period)))
    .orderBy(desc(popularitySnapshots.capturedAt))
    .limit(1);
  if (!latest) return new Map();
  const rows = await db
    .select({ distroId: popularitySnapshots.distroId, rank: popularitySnapshots.rank })
    .from(popularitySnapshots)
    .where(and(eq(popularitySnapshots.source, source), eq(popularitySnapshots.period, period), eq(popularitySnapshots.capturedAt, latest.capturedAt)));
  return new Map(rows.map((r) => [r.distroId, r.rank]));
}

/** Rank positions from a value map (higher value = better rank). */
export function ranksFromValues(values: Map<number, number>): Map<number, number> {
  const sorted = [...values].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return new Map(sorted.map(([id], i) => [id, i + 1]));
}

/**
 * Build and store the composite index for the 12-month and 1-month periods at
 * `capturedAt`. Returns the number of distros ranked over 12 months.
 */
export async function writeCompositeIndex(db: Database, capturedAt: Date): Promise<number> {
  const listed = new Set((await getDistroList(db)).map((d) => d.slug));
  const ids = await db.select({ id: distros.id, slug: distros.slug }).from(distros);
  const listedIds = ids.filter((d) => listed.has(d.slug)).map((d) => d.id);

  // GitHub: latest stars per distro's main repo.
  const gh = await db
    .select({ distroId: githubRepos.distroId, stars: sql<number>`max(${githubSnapshots.stars})::int` })
    .from(githubSnapshots)
    .innerJoin(githubRepos, eq(githubSnapshots.repoId, githubRepos.id))
    .groupBy(githubRepos.distroId);
  const githubRanks = ranksFromValues(new Map(gh.map((r) => [r.distroId, Number(r.stars)])));

  const since = new Date(capturedAt.getTime() - 90 * 86_400_000).toISOString().slice(0, 10);
  const siteViewRanks = ranksFromValues(await pageViewsSince(db, since));

  let ranked12 = 0;
  for (const period of ["last-12-months", "last-1-month"] as const) {
    const rows = compositeRanks(listedIds, {
      interest: await latestRanks(db, "interest", period),
      distrowatch: await latestRanks(db, "distrowatch", period),
      github: githubRanks,
      siteViews: siteViewRanks,
    });
    if (period === "last-12-months") ranked12 = rows.length;
    await db
      .delete(popularitySnapshots)
      .where(and(eq(popularitySnapshots.source, "composite"), eq(popularitySnapshots.period, period), eq(popularitySnapshots.capturedAt, capturedAt)));
    for (const r of rows) {
      await db.insert(popularitySnapshots).values({
        source: "composite",
        distroId: r.distroId,
        capturedAt,
        rank: r.rank,
        // Score ×1000 so the integer column keeps three decimals; it is never shown as "hits".
        hitsPerDay: Math.round(r.score * 1000),
        period,
      });
    }
  }
  return ranked12;
}
