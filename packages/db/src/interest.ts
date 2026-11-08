import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "./client.js";
import { affiliateClickDays, distroAliases, distros, pageViewDays, pageviewMonths, popularitySnapshots } from "./schema.js";
import { getDistroList } from "./queries.js";

/** Distros with an English Wikipedia article: [distroId, title]. */
export async function listEnwikiTitles(db: Database): Promise<{ distroId: number; slug: string; title: string }[]> {
  return db
    .select({ distroId: distroAliases.distroId, slug: distros.slug, title: distroAliases.alias })
    .from(distroAliases)
    .innerJoin(distros, eq(distroAliases.distroId, distros.id))
    .where(eq(distroAliases.source, "enwiki"));
}

/** Insert or replace monthly views for one distro. */
export async function upsertPageviewMonths(
  db: Database,
  source: string,
  distroId: number,
  months: { month: string; views: number }[],
): Promise<void> {
  for (const m of months) {
    await db
      .insert(pageviewMonths)
      .values({ source, distroId, month: m.month, views: m.views })
      .onConflictDoUpdate({
        target: [pageviewMonths.source, pageviewMonths.distroId, pageviewMonths.month],
        set: { views: m.views },
      });
  }
}

/** Latest month stored for a source ("2026-10"), or null. */
export async function latestPageviewMonth(db: Database, source: string): Promise<string | null> {
  const [row] = await db
    .select({ month: pageviewMonths.month })
    .from(pageviewMonths)
    .where(eq(pageviewMonths.source, source))
    .orderBy(desc(pageviewMonths.month))
    .limit(1);
  return row?.month ?? null;
}

/** Count one view of our own distro page for a UTC day ("2026-11-06"). */
export async function countPageView(db: Database, distroId: number, day: string): Promise<void> {
  await db
    .insert(pageViewDays)
    .values({ distroId, day, views: 1 })
    .onConflictDoUpdate({
      target: [pageViewDays.distroId, pageViewDays.day],
      set: { views: sql`${pageViewDays.views} + 1` },
    });
}

/** Our own page views per distro since a day (inclusive). */
export async function pageViewsSince(db: Database, day: string): Promise<Map<number, number>> {
  const rows = await db
    .select({ distroId: pageViewDays.distroId, views: sql<number>`sum(${pageViewDays.views})::int` })
    .from(pageViewDays)
    .where(gte(pageViewDays.day, day))
    .groupBy(pageViewDays.distroId);
  return new Map(rows.map((r) => [r.distroId, Number(r.views)]));
}

/** Monthly views per distro for one source, months in [from, to]. */
export async function pageviewsByDistro(
  db: Database,
  source: string,
  from: string,
  to: string,
): Promise<Map<number, { month: string; views: number }[]>> {
  const rows = await db
    .select()
    .from(pageviewMonths)
    .where(and(eq(pageviewMonths.source, source), gte(pageviewMonths.month, from), sql`${pageviewMonths.month} <= ${to}`));
  const out = new Map<number, { month: string; views: number }[]>();
  for (const r of rows) {
    const list = out.get(r.distroId) ?? [];
    list.push({ month: r.month, views: r.views });
    out.set(r.distroId, list);
  }
  return out;
}

/** "2026-10" minus n months. */
export function monthMinus(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 - n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface InterestRow {
  distroId: number;
  /** Average views per day over the window. */
  perDay: number;
  rank: number;
}

/**
 * Rank distros by average daily views over `months` full months ending at
 * `to`. A distro needs at least `minMonths` months of data in the window to
 * be ranked (so a new article doesn't jump in on one month). Ties break by
 * distro id, so the result is stable.
 */
export function rankByViews(
  views: Map<number, { month: string; views: number }[]>,
  to: string,
  months: number,
  minMonths: number,
): InterestRow[] {
  const from = monthMinus(to, months - 1);
  const days = (month: string) => {
    const [y, m] = month.split("-").map(Number) as [number, number];
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  };
  const scored: { distroId: number; perDay: number }[] = [];
  for (const [distroId, list] of views) {
    const inWindow = list.filter((x) => x.month >= from && x.month <= to);
    if (inWindow.length < minMonths) continue;
    const total = inWindow.reduce((s, x) => s + x.views, 0);
    const dayCount = inWindow.reduce((s, x) => s + days(x.month), 0);
    if (total <= 0) continue;
    scored.push({ distroId, perDay: total / dayCount });
  }
  scored.sort((a, b) => b.perDay - a.perDay || a.distroId - b.distroId);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}

export interface RankCompareRow {
  slug: string;
  name: string;
  a: number | null;
  b: number | null;
}

export interface RankCompare {
  a: string;
  b: string;
  capturedA: string | null;
  capturedB: string | null;
  /** Distros ranked by both. */
  both: number;
  onlyA: number;
  onlyB: number;
  /** Spearman rank correlation over distros ranked by both, or null below 10. */
  spearman: number | null;
  /** Overlap of the two top-25 lists. */
  top25Overlap: number;
  /** Ranked by both, largest |a - b| first. */
  biggestGaps: RankCompareRow[];
  /** Our top 50 by source b, with both ranks. */
  topB: RankCompareRow[];
}

/** Latest 12-month ranks of two sources side by side, for the shadow period. */
export async function compareRankSources(db: Database, a: string, b: string): Promise<RankCompare> {
  const latest = async (source: string) => {
    const [row] = await db
      .select({ capturedAt: popularitySnapshots.capturedAt })
      .from(popularitySnapshots)
      .where(and(eq(popularitySnapshots.source, source), eq(popularitySnapshots.period, "last-12-months")))
      .orderBy(desc(popularitySnapshots.capturedAt))
      .limit(1);
    if (!row) return { at: null as Date | null, ranks: new Map<number, number>() };
    const rows = await db
      .select({ distroId: popularitySnapshots.distroId, rank: popularitySnapshots.rank })
      .from(popularitySnapshots)
      .where(
        and(
          eq(popularitySnapshots.source, source),
          eq(popularitySnapshots.period, "last-12-months"),
          eq(popularitySnapshots.capturedAt, row.capturedAt),
        ),
      );
    return { at: row.capturedAt, ranks: new Map(rows.map((r) => [r.distroId, r.rank])) };
  };
  const [ra, rb] = await Promise.all([latest(a), latest(b)]);
  const all = await db.select({ id: distros.id, slug: distros.slug, name: distros.name }).from(distros);
  const byId = new Map(all.map((d) => [d.id, d]));
  const row = (id: number): RankCompareRow => ({ slug: byId.get(id)!.slug, name: byId.get(id)!.name, a: ra.ranks.get(id) ?? null, b: rb.ranks.get(id) ?? null });

  const bothIds = [...ra.ranks.keys()].filter((id) => rb.ranks.has(id));
  // Re-rank within the shared set so Spearman compares like with like.
  const rerank = (ranks: Map<number, number>) => {
    const sorted = [...bothIds].sort((x, y) => ranks.get(x)! - ranks.get(y)!);
    return new Map(sorted.map((id, i) => [id, i + 1]));
  };
  let spearman: number | null = null;
  if (bothIds.length >= 10) {
    const pa = rerank(ra.ranks);
    const pb = rerank(rb.ranks);
    const n = bothIds.length;
    const d2 = bothIds.reduce((s, id) => s + (pa.get(id)! - pb.get(id)!) ** 2, 0);
    spearman = Number((1 - (6 * d2) / (n * (n * n - 1))).toFixed(3));
  }
  const top = (ranks: Map<number, number>, n: number) => new Set([...ranks].filter(([, r]) => r <= n).map(([id]) => id));
  const ta = top(ra.ranks, 25);
  const top25Overlap = [...top(rb.ranks, 25)].filter((id) => ta.has(id)).length;

  return {
    a,
    b,
    capturedA: ra.at?.toISOString().slice(0, 10) ?? null,
    capturedB: rb.at?.toISOString().slice(0, 10) ?? null,
    both: bothIds.length,
    onlyA: ra.ranks.size - bothIds.length,
    onlyB: rb.ranks.size - bothIds.length,
    spearman,
    top25Overlap,
    biggestGaps: bothIds
      .map(row)
      .sort((x, y) => Math.abs(y.a! - y.b!) - Math.abs(x.a! - x.b!) || x.slug.localeCompare(y.slug))
      .slice(0, 25),
    topB: [...rb.ranks]
      .sort((x, y) => x[1] - y[1])
      .slice(0, 50)
      .map(([id]) => row(id)),
  };
}

/**
 * Write our "interest" index: the 12-month and 1-month ranks from Wikipedia
 * views up to `to`, as popularity snapshots captured on the first day after
 * that month. Replaces an earlier write for the same capture, so a re-run is
 * idempotent. Returns how many distros were ranked over 12 months.
 */
export async function writeInterestIndex(db: Database, to: string): Promise<number> {
  // Only distros in our public catalogue are ranked, so ranks have no gaps
  // (discovered distros without a signal, e.g. phone OSes, stay out).
  const listed = new Set((await getDistroList(db)).map((d) => d.slug));
  const ids = await db.select({ id: distros.id, slug: distros.slug }).from(distros);
  const listedIds = new Set(ids.filter((d) => listed.has(d.slug)).map((d) => d.id));
  const allViews = await pageviewsByDistro(db, "enwiki", monthMinus(to, 11), to);
  const views = new Map([...allViews].filter(([id]) => listedIds.has(id)));
  const [y, m] = to.split("-").map(Number) as [number, number];
  const capturedAt = new Date(Date.UTC(y, m, 1));
  const periods: [string, number, number][] = [
    ["last-12-months", 12, 6],
    ["last-1-month", 1, 1],
  ];
  let ranked12 = 0;
  for (const [period, months, minMonths] of periods) {
    const rows = rankByViews(views, to, months, minMonths);
    if (period === "last-12-months") ranked12 = rows.length;
    await db
      .delete(popularitySnapshots)
      .where(
        and(
          eq(popularitySnapshots.source, "interest"),
          eq(popularitySnapshots.period, period),
          eq(popularitySnapshots.capturedAt, capturedAt),
        ),
      );
    for (const r of rows) {
      await db.insert(popularitySnapshots).values({
        source: "interest",
        distroId: r.distroId,
        capturedAt,
        rank: r.rank,
        hitsPerDay: Math.round(r.perDay),
        period,
      });
    }
  }
  return ranked12;
}

/** Count one click on an affiliate redirect: one counter per partner per UTC day. */
export async function countAffiliateClick(db: Database, partner: string, day: string): Promise<void> {
  await db
    .insert(affiliateClickDays)
    .values({ partner, day, clicks: 1 })
    .onConflictDoUpdate({
      target: [affiliateClickDays.partner, affiliateClickDays.day],
      set: { clicks: sql`${affiliateClickDays.clicks} + 1` },
    });
}

export type AffiliateClickTotals = { partner: string; last7: number; last30: number; allTime: number }[];

/** Click totals per partner for the admin page. */
export async function affiliateClickTotals(db: Database, today: string = new Date().toISOString().slice(0, 10)): Promise<AffiliateClickTotals> {
  const dayMinus = (n: number) => new Date(new Date(`${today}T00:00:00Z`).getTime() - n * 86_400_000).toISOString().slice(0, 10);
  const d7 = dayMinus(6);
  const d30 = dayMinus(29);
  const rows = await db
    .select({
      partner: affiliateClickDays.partner,
      last7: sql<number>`coalesce(sum(case when ${affiliateClickDays.day} >= ${d7} then ${affiliateClickDays.clicks} else 0 end), 0)::int`,
      last30: sql<number>`coalesce(sum(case when ${affiliateClickDays.day} >= ${d30} then ${affiliateClickDays.clicks} else 0 end), 0)::int`,
      allTime: sql<number>`coalesce(sum(${affiliateClickDays.clicks}), 0)::int`,
    })
    .from(affiliateClickDays)
    .groupBy(affiliateClickDays.partner)
    .orderBy(affiliateClickDays.partner);
  return rows;
}
