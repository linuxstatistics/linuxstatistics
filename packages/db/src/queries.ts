import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import { MAIN_PERIOD, PERIODS, RANK_SOURCE, TRENDING_PERIOD } from "@linux-statistics/shared";
import { getDistroReleases } from "./releases.js";
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
  distroAliases,
  distros,
  popularitySnapshots,
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
import { getPickerFit } from "./picker-feedback.js";

/** Votes needed before the quiz fit share is shown. */
export const QUIZ_FIT_MIN_VOTES = 30;

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const EMPTY_AGG: ContributionAggregate = { average: null, count: 0, mean: null, verifiedCount: 0, usesItCount: 0 };

function ratingOf(a: ContributionAggregate) {
  return { average: a.average, count: a.count, mean: a.mean, verifiedCount: a.verifiedCount };
}

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
    .from(popularitySnapshots)
    .where(and(eq(popularitySnapshots.source, RANK_SOURCE), eq(popularitySnapshots.period, MAIN_PERIOD)))
    .orderBy(desc(popularitySnapshots.capturedAt));
  const dw1mAll = await db
    .select()
    .from(popularitySnapshots)
    .where(and(eq(popularitySnapshots.source, RANK_SOURCE), eq(popularitySnapshots.period, TRENDING_PERIOD)))
    .orderBy(desc(popularitySnapshots.capturedAt));
  const repos = await db.select().from(githubRepos);
  const ghAll = await db
    .select()
    .from(githubSnapshots)
    .orderBy(desc(githubSnapshots.capturedAt));
  const aggByDistro = await getContributionAggregates(db);

  const dwByDistro = groupBy(dwAll, (s) => s.distroId); // each list is desc by capturedAt
  const dw1mLatest = new Map<number, (typeof dw1mAll)[number]>();
  for (const s of dw1mAll) if (!dw1mLatest.has(s.distroId)) dw1mLatest.set(s.distroId, s);
  const repoByDistro = new Map(repos.map((r) => [r.distroId, r]));
  const ghLatestByRepo = new Map<number, (typeof ghAll)[number]>();
  for (const g of ghAll) if (!ghLatestByRepo.has(g.repoId)) ghLatestByRepo.set(g.repoId, g);

  // Discovered distros stay unlisted until something shows they're in use.
  const visible = allDistros.filter(
    (d) => d.discoveredVia == null || dwByDistro.has(d.id) || repoByDistro.has(d.id) || (aggByDistro.get(d.id)?.count ?? 0) > 0 || (aggByDistro.get(d.id)?.usesItCount ?? 0) > 0,
  );
  const items = visible.map((d): DistroListItem => {
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
    const rank1m = dw1mLatest.get(d.id)?.rank ?? null;
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
      rank1m,
      rank1mDelta: latest && rank1m !== null ? latest.rank - rank1m : null,
      userRating: ratingOf(aggByDistro.get(d.id) ?? EMPTY_AGG),
      usesItCount: (aggByDistro.get(d.id) ?? EMPTY_AGG).usesItCount,
    };
  });

  return items.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}

/**
 * Biggest climbers: distros whose 1-month rank beats their 12-month rank,
 * largest climb first. Distros outside the 12-month top `maxRank` (default 100) are left out
 * to cut noise from tiny hit counts.
 */
export async function getRising(
  db: Database,
  limit = 20,
  maxRank = 100,
): Promise<DistroListItem[]> {
  const list = await getDistroList(db);
  return list
    .filter(
      (d): d is DistroListItem & { rank: number; rank1mDelta: number } =>
        d.rank !== null && d.rank <= maxRank && (d.rank1mDelta ?? 0) > 0,
    )
    .sort((a, b) => b.rank1mDelta - a.rank1mDelta || a.rank - b.rank)
    .slice(0, limit);
}

/** Canonical slug for a slug or a legacy alias; null if unknown. */
export async function resolveSlug(db: Database, slug: string): Promise<string | null> {
  const [direct] = await db.select({ slug: distros.slug }).from(distros).where(eq(distros.slug, slug));
  if (direct) return direct.slug;
  const [viaAlias] = await db
    .select({ slug: distros.slug })
    .from(distroAliases)
    .innerJoin(distros, eq(distroAliases.distroId, distros.id))
    .where(eq(distroAliases.alias, slug));
  return viaAlias?.slug ?? null;
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
  const canonical = await resolveSlug(db, slug);
  if (!canonical) return null;
  const [d] = await db.select().from(distros).where(eq(distros.slug, canonical));
  if (!d) return null;

  const snaps = await db
    .select()
    .from(popularitySnapshots)
    .where(and(eq(popularitySnapshots.source, RANK_SOURCE), eq(popularitySnapshots.distroId, d.id), eq(popularitySnapshots.period, MAIN_PERIOD)))
    .orderBy(asc(popularitySnapshots.capturedAt));
  const [latest1m] = await db
    .select()
    .from(popularitySnapshots)
    .where(and(eq(popularitySnapshots.source, RANK_SOURCE), eq(popularitySnapshots.distroId, d.id), eq(popularitySnapshots.period, TRENDING_PERIOD)))
    .orderBy(desc(popularitySnapshots.capturedAt))
    .limit(1);
  const rankByPeriod: DistroDetail["rankByPeriod"] = [];
  for (const period of PERIODS) {
    const [snap] = await db
      .select()
      .from(popularitySnapshots)
      .where(and(eq(popularitySnapshots.source, RANK_SOURCE), eq(popularitySnapshots.distroId, d.id), eq(popularitySnapshots.period, period)))
      .orderBy(desc(popularitySnapshots.capturedAt))
      .limit(1);
    if (snap) rankByPeriod.push({ period, rank: snap.rank, hitsPerDay: snap.hitsPerDay });
  }
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
  const fit = await getPickerFit(db, d.slug);
  const releases = await getDistroReleases(db, d.id);

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
    rank1m: latest1m?.rank ?? null,
    rank1mDelta: latest && latest1m ? latest.rank - latest1m.rank : null,
    basedOnSlug: d.basedOnSlug,
    homepage: d.homepage,
    description: d.description,
    logoUrl: d.logoUrl,
    firstReleaseYear: d.firstReleaseYear,
    repoFullName: repo?.repoFullName ?? null,
    rankHistory,
    rankByPeriod,
    starsHistory,
    releases,
    quizFit: fit.total >= QUIZ_FIT_MIN_VOTES ? fit : null,
    userRating: ratingOf(agg),
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
  const sources: IngestionSource[] = ["distrowatch", "statcounter", "github", "wikidata", "wikipedia", "endoflife", "descriptions"];
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
