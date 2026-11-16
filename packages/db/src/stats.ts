import { and, count, eq, gte, isNotNull, or, sql } from "drizzle-orm";
import type { CountPair, StatsPayload } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import { distroContributions, distroReleases, distros, pageViewDays, pickerFeedback, quizCompletions, switchReports } from "./schema.js";
import { getDistroList } from "./queries.js";
import { getSiteMetrics } from "./first-party.js";

const DAY = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Totals for the /stats page: open data we already hold plus our own counters.
 * No third-party rank data (export rule). `now` is injectable for tests.
 */
export async function getStats(db: Database, now = new Date(), soonDays = 120): Promise<StatsPayload> {
  const list = await getDistroList(db);
  const listed = new Map(list.map((d) => [d.slug, d]));
  const today = isoDay(now);
  const since30 = isoDay(new Date(now.getTime() - 30 * DAY));
  const since30At = new Date(now.getTime() - 30 * DAY);

  const [tracked] = await db.select({ value: count() }).from(distros);

  const fam = new Map<string, number>();
  for (const d of list) fam.set(d.family, (fam.get(d.family) ?? 0) + 1);
  const families = [...fam].map(([family, n]) => ({ family, count: n })).sort((a, b) => b.count - a.count);

  const withRepo = list.filter((d) => d.repoFullName);
  const github = {
    repos: withRepo.length,
    stars: withRepo.reduce((s, d) => s + (d.stars ?? 0), 0),
    commitsLast30d: withRepo.reduce((s, d) => s + (d.commitsLast30d ?? 0), 0),
  };

  const releases = await db
    .select({
      slug: distros.slug,
      name: distros.name,
      cycle: distroReleases.cycle,
      releasedOn: distroReleases.releasedOn,
      eol: distroReleases.eol,
      supportEnds: distroReleases.supportEnds,
    })
    .from(distroReleases)
    .innerJoin(distros, eq(distros.id, distroReleases.distroId));
  const year = today.slice(0, 4);
  const shown = releases.filter((r) => listed.has(r.slug));
  const releasesThisYear = shown.filter((r) => r.releasedOn?.startsWith(year)).length;
  const soon = isoDay(new Date(now.getTime() + soonDays * DAY));
  const supportEndingSoon = shown
    .map((r) => ({ slug: r.slug, name: listed.get(r.slug)!.name, cycle: r.cycle, endsOn: r.eol ?? r.supportEnds ?? "" }))
    .filter((r) => r.endsOn >= today && r.endsOn <= soon)
    .sort((a, b) => a.endsOn.localeCompare(b.endsOn) || a.name.localeCompare(b.name))
    .slice(0, 5);

  const pair = (total: unknown, recent: unknown): CountPair => ({ total: Number(total ?? 0), last30d: Number(recent ?? 0) });

  const [views] = await db
    .select({
      total: sql<number>`coalesce(sum(${pageViewDays.views}), 0)::int`,
      recent: sql<number>`coalesce(sum(${pageViewDays.views}) filter (where ${pageViewDays.day} >= ${since30}), 0)::int`,
    })
    .from(pageViewDays);
  const [votes] = await db
    .select({
      total: count(),
      recent: sql<number>`count(*) filter (where ${pickerFeedback.day} >= ${since30})::int`,
    })
    .from(pickerFeedback);
  const [contribs] = await db
    .select({
      total: count(),
      recent: sql<number>`count(*) filter (where ${gte(distroContributions.createdAt, since30At)})::int`,
    })
    .from(distroContributions)
    .where(
      and(
        eq(distroContributions.status, "visible"),
        or(isNotNull(distroContributions.rating), eq(distroContributions.usesIt, true)),
      ),
    );

  const [quizzes] = await db
    .select({ total: count(), recent: sql<number>`count(*) filter (where ${quizCompletions.day} >= ${since30})::int` })
    .from(quizCompletions);
  const [switched] = await db
    .select({ total: count(), recent: sql<number>`count(*) filter (where ${switchReports.day} >= ${since30})::int` })
    .from(switchReports);
  const byOrigin = await db
    .select({ cameFrom: switchReports.cameFrom, count: sql<number>`count(*)::int` })
    .from(switchReports)
    .groupBy(switchReports.cameFrom)
    .orderBy(sql`count(*) desc`, switchReports.cameFrom);

  const own = await getSiteMetrics(db);
  const repo = own.repo_stars != null ? { stars: own.repo_stars, contributors: own.repo_contributors ?? 0 } : null;

  return {
    generatedAt: now.toISOString(),
    trackedDistros: Number(tracked?.value ?? 0),
    listedDistros: list.length,
    families,
    github,
    releasesThisYear,
    supportEndingSoon,
    site: {
      pageViews: pair(views?.total, views?.recent),
      quizVotes: pair(votes?.total, votes?.recent),
      quizCompletions: pair(quizzes?.total, quizzes?.recent),
      contributions: pair(contribs?.total, contribs?.recent),
      repo,
      switchers: { ...pair(switched?.total, switched?.recent), byOrigin: byOrigin.map((r) => ({ cameFrom: r.cameFrom, count: Number(r.count) })) },
    },
  };
}
