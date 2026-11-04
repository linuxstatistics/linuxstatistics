import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import type {
  DistroDetail,
  DistroListItem,
  GalaxyBody,
  GalaxyPayload,
  IngestionSource,
  MarketSharePoint,
  Meta,
  SourceFreshness,
  TimeSeriesPoint,
} from "@linux-statistics/shared";
import type { Database } from "./client.js";
import {
  distros,
  distrowatchSnapshots,
  githubRepos,
  githubSnapshots,
  ingestionRuns,
  marketShare,
} from "./schema.js";
import {
  getContributionAggregates,
  getMyContribution,
  type ContributionAggregate,
} from "./contributions.js";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const EMPTY_AGG: ContributionAggregate = { average: null, count: 0, usesItCount: 0 };

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const existing = map.get(k);
    if (existing) existing.push(row);
    else map.set(k, [row]);
  }
  return map;
}

/**
 * The leaderboard rows: latest rank/hits, latest GitHub stars/commits, and the
 * 1-year rank trend (positive = improved, since a lower rank number is better).
 * Sorted by rank ascending (unranked distros last).
 */
export async function getDistroList(db: Database): Promise<DistroListItem[]> {
  const allDistros = await db.select().from(distros);
  const dwAll = await db
    .select()
    .from(distrowatchSnapshots)
    .orderBy(desc(distrowatchSnapshots.capturedAt));
  const repos = await db.select().from(githubRepos);
  const ghAll = await db
    .select()
    .from(githubSnapshots)
    .orderBy(desc(githubSnapshots.capturedAt));
  const aggByDistro = await getContributionAggregates(db);

  const dwByDistro = groupBy(dwAll, (s) => s.distroId); // each list is desc by capturedAt
  const repoByDistro = new Map(repos.map((r) => [r.distroId, r]));
  const ghLatestByRepo = new Map<number, (typeof ghAll)[number]>();
  for (const g of ghAll) if (!ghLatestByRepo.has(g.repoId)) ghLatestByRepo.set(g.repoId, g);

  const items = allDistros.map((d): DistroListItem => {
    const snaps = dwByDistro.get(d.id) ?? [];
    const latest = snaps[0];
    let rankTrend: number | null = null;
    if (latest && snaps.length > 1) {
      const cutoff = latest.capturedAt.getTime() - YEAR_MS;
      const older =
        snaps.find((s) => s.capturedAt.getTime() <= cutoff) ?? snaps[snaps.length - 1];
      if (older && older !== latest) rankTrend = older.rank - latest.rank;
    }
    const repo = repoByDistro.get(d.id);
    const gh = repo ? ghLatestByRepo.get(repo.id) : undefined;
    return {
      slug: d.slug,
      name: d.name,
      family: d.family,
      status: d.status,
      rank: latest?.rank ?? null,
      hitsPerDay: latest?.hitsPerDay ?? null,
      stars: repo?.stars ?? gh?.stars ?? null,
      commitsLast30d: gh?.commitsLast30d ?? null,
      firstReleaseYear: d.firstReleaseYear,
      repoFullName: repo?.repoFullName ?? null,
      rankTrend,
      userRating: {
        average: (aggByDistro.get(d.id) ?? EMPTY_AGG).average,
        count: (aggByDistro.get(d.id) ?? EMPTY_AGG).count,
      },
      usesItCount: (aggByDistro.get(d.id) ?? EMPTY_AGG).usesItCount,
    };
  });

  return items.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}

/** The 3D scene payload: Sun (#1), planets (#2–#10), starfield (the rest). */
export async function getGalaxy(db: Database): Promise<GalaxyPayload> {
  const ranked = (await getDistroList(db)).filter(
    (d): d is DistroListItem & { rank: number } => d.rank !== null,
  );
  const maxHits = Math.max(1, ...ranked.map((d) => d.hitsPerDay ?? 0));
  const toBody = (d: DistroListItem & { rank: number }): GalaxyBody => ({
    slug: d.slug,
    name: d.name,
    family: d.family,
    rank: d.rank,
    hitsPerDay: d.hitsPerDay ?? 0,
    stars: d.stars,
    popularity: Math.max(0, Math.min(1, (d.hitsPerDay ?? 0) / maxHits)),
  });
  const sorted = [...ranked].sort((a, b) => a.rank - b.rank);
  const sun = sorted[0] ? toBody(sorted[0]) : null;
  if (!sun) {
    // No ranked data yet; return an empty-ish payload the frontend can handle.
    return { sun: { slug: "", name: "", family: "other", rank: 0, hitsPerDay: 0, stars: null, popularity: 0 }, planets: [], starfield: [] };
  }
  return {
    sun,
    planets: sorted.slice(1, 10).map(toBody),
    starfield: sorted.slice(10).map(toBody),
  };
}

/** Full detail for one distro, including its rank and stars history. */
export async function getDistroDetail(
  db: Database,
  slug: string,
  userId?: number,
): Promise<DistroDetail | null> {
  const [d] = await db.select().from(distros).where(eq(distros.slug, slug));
  if (!d) return null;

  const snaps = await db
    .select()
    .from(distrowatchSnapshots)
    .where(eq(distrowatchSnapshots.distroId, d.id))
    .orderBy(asc(distrowatchSnapshots.capturedAt));
  const [repo] = await db
    .select()
    .from(githubRepos)
    .where(eq(githubRepos.distroId, d.id));
  const ghSnaps = repo
    ? await db
        .select()
        .from(githubSnapshots)
        .where(eq(githubSnapshots.repoId, repo.id))
        .orderBy(asc(githubSnapshots.capturedAt))
    : [];

  const latest = snaps[snaps.length - 1];
  let rankTrend: number | null = null;
  if (latest && snaps.length > 1) {
    const cutoff = latest.capturedAt.getTime() - YEAR_MS;
    const older = [...snaps].reverse().find((s) => s.capturedAt.getTime() <= cutoff) ?? snaps[0];
    if (older && older !== latest) rankTrend = older.rank - latest.rank;
  }
  const latestGh = ghSnaps[ghSnaps.length - 1];

  const rankHistory: TimeSeriesPoint[] = snaps.map((s) => ({
    capturedAt: s.capturedAt.toISOString(),
    value: s.rank,
  }));
  const starsHistory: TimeSeriesPoint[] = ghSnaps.map((s) => ({
    capturedAt: s.capturedAt.toISOString(),
    value: s.stars,
  }));

  const agg = (await getContributionAggregates(db)).get(d.id) ?? EMPTY_AGG;
  const mine = userId != null ? await getMyContribution(db, userId, d.id) : null;

  return {
    slug: d.slug,
    name: d.name,
    family: d.family,
    status: d.status,
    rank: latest?.rank ?? null,
    hitsPerDay: latest?.hitsPerDay ?? null,
    stars: repo?.stars ?? null,
    commitsLast30d: latestGh?.commitsLast30d ?? null,
    rankTrend,
    basedOnSlug: d.basedOnSlug,
    homepage: d.homepage,
    logoUrl: d.logoUrl,
    firstReleaseYear: d.firstReleaseYear,
    repoFullName: repo?.repoFullName ?? null,
    rankHistory,
    starsHistory,
    userRating: { average: agg.average, count: agg.count },
    usesItCount: agg.usesItCount,
    myContribution: mine
      ? { rating: mine.rating, usesIt: mine.usesIt, reviewBody: mine.reviewBody }
      : null,
  };
}

/** Market-share time-series for a region (default "global"). */
export async function getMarketShare(
  db: Database,
  opts: { region?: string; from?: Date; to?: Date } = {},
): Promise<MarketSharePoint[]> {
  const region = opts.region ?? "global";
  const conds = [eq(marketShare.region, region)];
  if (opts.from) conds.push(gte(marketShare.capturedAt, opts.from));
  if (opts.to) conds.push(lte(marketShare.capturedAt, opts.to));
  const rows = await db
    .select()
    .from(marketShare)
    .where(and(...conds))
    .orderBy(asc(marketShare.capturedAt));
  return rows.map((r) => ({
    capturedAt: r.capturedAt.toISOString(),
    region: r.region,
    platform: r.platform,
    sharePct: Number(r.sharePct),
  }));
}

/** Tracked-distro count + per-source data freshness. */
export async function getMeta(db: Database): Promise<Meta> {
  const [tracked] = await db.select({ value: count() }).from(distros);
  const sources: IngestionSource[] = ["distrowatch", "statcounter", "github"];
  const freshness: SourceFreshness[] = [];
  for (const source of sources) {
    const [run] = await db
      .select()
      .from(ingestionRuns)
      .where(and(eq(ingestionRuns.source, source), eq(ingestionRuns.status, "success")))
      .orderBy(desc(ingestionRuns.finishedAt))
      .limit(1);
    freshness.push({
      source,
      lastSuccessAt: run?.finishedAt?.toISOString() ?? null,
      status: run ? "success" : "never",
    });
  }
  return { trackedDistros: Number(tracked?.value ?? 0), sources: freshness };
}
