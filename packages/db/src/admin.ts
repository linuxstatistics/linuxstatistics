import { and, desc, eq, sql } from "drizzle-orm";
import { SOURCE_CADENCE_DAYS, SOURCE_LABEL, ingestionSourceSchema, type IngestionSource } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import {
  affiliateClickDays,
  distroContributions,
  emailSignups,
  gapReports,
  ingestionRuns,
  pickerFeedback,
  quizCompletions,
  suggestions,
  switchReports,
} from "./schema.js";

const DAY = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
/** First day of the window that ends today: 7 days = today and the 6 before it. */
const windowStart = (now: Date, days: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (days - 1) * DAY);

export interface WindowCounts {
  last7: number;
  last30: number;
}

export interface SourceHealth {
  source: IngestionSource;
  label: string;
  cadenceDays: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  /** Last success older than twice the cadence (same rule as the site's freshness notice). */
  late: boolean;
  /** Newest run failed. */
  failing: boolean;
}

export interface AdminSummary {
  emailSignups: WindowCounts;
  quizCompletions: WindowCounts;
  fitYes: WindowCounts;
  fitNo: WindowCounts;
  switchReports: WindowCounts;
  ratings: WindowCounts;
  affiliateClicks: WindowCounts;
  openSuggestions: number;
  sources: SourceHealth[];
}

async function dayCounts(db: Database, table: typeof quizCompletions | typeof switchReports, now: Date): Promise<WindowCounts> {
  const d7 = isoDay(windowStart(now, 7));
  const d30 = isoDay(windowStart(now, 30));
  const [r] = await db
    .select({
      last7: sql<number>`count(*) filter (where ${table.day} >= ${d7})::int`,
      last30: sql<number>`count(*) filter (where ${table.day} >= ${d30})::int`,
    })
    .from(table);
  return { last7: Number(r?.last7 ?? 0), last30: Number(r?.last30 ?? 0) };
}

async function fitCounts(db: Database, fit: boolean, now: Date): Promise<WindowCounts> {
  const d7 = isoDay(windowStart(now, 7));
  const d30 = isoDay(windowStart(now, 30));
  const [r] = await db
    .select({
      last7: sql<number>`count(*) filter (where ${pickerFeedback.day} >= ${d7})::int`,
      last30: sql<number>`count(*) filter (where ${pickerFeedback.day} >= ${d30})::int`,
    })
    .from(pickerFeedback)
    .where(eq(pickerFeedback.fit, fit));
  return { last7: Number(r?.last7 ?? 0), last30: Number(r?.last30 ?? 0) };
}

function timeWindows(col: typeof emailSignups.createdAt | typeof distroContributions.createdAt, now: Date) {
  const t7 = windowStart(now, 7).toISOString();
  const t30 = windowStart(now, 30).toISOString();
  return {
    last7: sql<number>`count(*) filter (where ${col} >= ${t7})::int`,
    last30: sql<number>`count(*) filter (where ${col} >= ${t30})::int`,
  };
}

const counts = (r: { last7: number; last30: number } | undefined): WindowCounts => ({ last7: Number(r?.last7 ?? 0), last30: Number(r?.last30 ?? 0) });

/** Per-source state from `ingestion_runs`, in the order sources are listed in the schema. */
export async function sourceHealth(db: Database, now: Date = new Date()): Promise<SourceHealth[]> {
  const out: SourceHealth[] = [];
  for (const source of ingestionSourceSchema.options) {
    const [ok] = await db
      .select({ at: ingestionRuns.finishedAt })
      .from(ingestionRuns)
      .where(and(eq(ingestionRuns.source, source), eq(ingestionRuns.status, "success")))
      .orderBy(desc(ingestionRuns.finishedAt))
      .limit(1);
    const [bad] = await db
      .select({ at: ingestionRuns.finishedAt, error: ingestionRuns.error })
      .from(ingestionRuns)
      .where(and(eq(ingestionRuns.source, source), eq(ingestionRuns.status, "failed")))
      .orderBy(desc(ingestionRuns.finishedAt))
      .limit(1);
    const [newest] = await db
      .select({ status: ingestionRuns.status })
      .from(ingestionRuns)
      .where(eq(ingestionRuns.source, source))
      .orderBy(desc(ingestionRuns.startedAt), desc(ingestionRuns.id))
      .limit(1);
    const cadence = SOURCE_CADENCE_DAYS[source];
    const lastSuccessAt = ok?.at?.toISOString() ?? null;
    out.push({
      source,
      label: SOURCE_LABEL[source],
      cadenceDays: cadence,
      lastSuccessAt,
      lastFailureAt: bad?.at?.toISOString() ?? null,
      lastError: bad?.error ?? null,
      late: lastSuccessAt != null && (now.getTime() - new Date(lastSuccessAt).getTime()) / DAY > cadence * 2,
      failing: newest?.status === "failed",
    });
  }
  return out;
}

export interface IngestionRunRow {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "failed";
  rowsWritten: number;
  error: string | null;
}

/** Newest runs for one source, for the data-health page. */
export async function recentIngestionRuns(db: Database, source: IngestionSource, limit = 20): Promise<IngestionRunRow[]> {
  const rows = await db
    .select()
    .from(ingestionRuns)
    .where(eq(ingestionRuns.source, source))
    .orderBy(desc(ingestionRuns.startedAt), desc(ingestionRuns.id))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
    status: r.status,
    rowsWritten: r.rowsWritten,
    error: r.error,
  }));
}

/** Counts for the admin dashboard: last 7 and 30 days (UTC, today included), plus what needs a person. */
export async function adminSummary(db: Database, now: Date = new Date()): Promise<AdminSummary> {
  const d7 = isoDay(windowStart(now, 7));
  const d30 = isoDay(windowStart(now, 30));
  const [clicks] = await db
    .select({
      last7: sql<number>`coalesce(sum(${affiliateClickDays.clicks}) filter (where ${affiliateClickDays.day} >= ${d7}), 0)::int`,
      last30: sql<number>`coalesce(sum(${affiliateClickDays.clicks}) filter (where ${affiliateClickDays.day} >= ${d30}), 0)::int`,
    })
    .from(affiliateClickDays);
  const [open] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(suggestions)
    .where(eq(suggestions.status, "new"));
  return {
    emailSignups: counts((await db.select(timeWindows(emailSignups.createdAt, now)).from(emailSignups))[0]),
    quizCompletions: await dayCounts(db, quizCompletions, now),
    fitYes: await fitCounts(db, true, now),
    fitNo: await fitCounts(db, false, now),
    switchReports: await dayCounts(db, switchReports, now),
    ratings: counts((await db.select(timeWindows(distroContributions.createdAt, now)).from(distroContributions).where(sql`${distroContributions.rating} is not null`))[0]),
    affiliateClicks: { last7: Number(clicks?.last7 ?? 0), last30: Number(clicks?.last30 ?? 0) },
    openSuggestions: Number(open?.n ?? 0),
    sources: await sourceHealth(db, now),
  };
}


export interface QuizStats {
  /** Completions per UTC day for the last 30 days, oldest first, zero days included. */
  perDay: { day: string; pick: number; start: number }[];
  /** First result per quiz, most frequent first (top 15 each). */
  topPicks: { quiz: string; topKey: string; n: number }[];
  /** Answer sets per quiz, most frequent first (top 15 each). Codes are decoded by the site. */
  topCodes: { quiz: string; code: string; n: number }[];
  /** "Did it fit?" votes per top pick, all time. */
  fit: { topKey: string; yes: number; n: number }[];
  switchFrom: { key: string; n: number }[];
  switchTo: { key: string; n: number }[];
  totals: { completions: number; votes: number; switchReports: number };
}

const TOP = 15;

/** Quiz and switch-report totals for the admin quiz page. */
export async function quizStats(db: Database, now: Date = new Date()): Promise<QuizStats> {
  const from = windowStart(now, 30);
  const d30 = isoDay(from);
  const daily = await db
    .select({ day: quizCompletions.day, quiz: quizCompletions.quiz, n: sql<number>`count(*)::int` })
    .from(quizCompletions)
    .where(sql`${quizCompletions.day} >= ${d30}`)
    .groupBy(quizCompletions.day, quizCompletions.quiz);
  const perDay = Array.from({ length: 30 }, (_, i) => ({ day: isoDay(new Date(from.getTime() + i * DAY)), pick: 0, start: 0 }));
  const byDay = new Map(perDay.map((d) => [d.day, d]));
  for (const r of daily) {
    const d = byDay.get(r.day);
    if (d && (r.quiz === "pick" || r.quiz === "start")) d[r.quiz] += Number(r.n);
  }

  const ranked = async <K extends "topKey" | "code">(col: K) => {
    const c = col === "topKey" ? quizCompletions.topKey : quizCompletions.code;
    const rows = await db
      .select({ quiz: quizCompletions.quiz, key: c, n: sql<number>`count(*)::int` })
      .from(quizCompletions)
      .groupBy(quizCompletions.quiz, c)
      .orderBy(desc(sql`count(*)`), quizCompletions.quiz, c);
    const seen = new Map<string, number>();
    return rows.filter((r) => {
      const k = (seen.get(r.quiz) ?? 0) + 1;
      seen.set(r.quiz, k);
      return k <= TOP;
    });
  };
  const picks = await ranked("topKey");
  const codes = await ranked("code");

  const fit = await db
    .select({ topKey: pickerFeedback.topKey, yes: sql<number>`count(*) filter (where ${pickerFeedback.fit})::int`, n: sql<number>`count(*)::int` })
    .from(pickerFeedback)
    .groupBy(pickerFeedback.topKey)
    .orderBy(desc(sql`count(*)`), pickerFeedback.topKey);

  const tally = async (col: typeof switchReports.cameFrom | typeof switchReports.nowUsing) =>
    (await db.select({ key: col, n: sql<number>`count(*)::int` }).from(switchReports).groupBy(col).orderBy(desc(sql`count(*)`), col))
      .map((r) => ({ key: r.key ?? "(not given)", n: Number(r.n) }));

  const [tc] = await db.select({ n: sql<number>`count(*)::int` }).from(quizCompletions);
  const [tr] = await db.select({ n: sql<number>`count(*)::int` }).from(switchReports);
  return {
    perDay,
    topPicks: picks.map((r) => ({ quiz: r.quiz, topKey: r.key, n: Number(r.n) })),
    topCodes: codes.map((r) => ({ quiz: r.quiz, code: r.key, n: Number(r.n) })),
    fit: fit.map((r) => ({ topKey: r.topKey, yes: Number(r.yes), n: Number(r.n) })),
    switchFrom: await tally(switchReports.cameFrom),
    switchTo: await tally(switchReports.nowUsing),
    totals: { completions: Number(tc?.n ?? 0), votes: fit.reduce((a, r) => a + Number(r.n), 0), switchReports: Number(tr?.n ?? 0) },
  };
}

const KEEP_GAP_REPORTS = 8;

/** Save one gap report (the worker's JSON) and keep only the newest few. */
export async function saveGapReport(db: Database, report: { generatedAt: string } & Record<string, unknown>): Promise<void> {
  await db.insert(gapReports).values({ generatedAt: new Date(report.generatedAt), report });
  const keep = await db.select({ id: gapReports.id }).from(gapReports).orderBy(desc(gapReports.generatedAt), desc(gapReports.id)).limit(KEEP_GAP_REPORTS);
  if (keep.length === KEEP_GAP_REPORTS) {
    await db.delete(gapReports).where(sql`${gapReports.id} not in (${sql.join(keep.map((k) => sql`${k.id}`), sql`, `)})`);
  }
}

export interface AdminGaps {
  /** Newest saved report, or null before the first weekly run. */
  report: unknown | null;
  /** Open "correction" and "add-distro" suggestions, newest first. */
  suggestions: { id: number; kind: string; subject: string | null; message: string; createdAt: string }[];
}

export async function adminGaps(db: Database): Promise<AdminGaps> {
  const [latest] = await db.select({ report: gapReports.report }).from(gapReports).orderBy(desc(gapReports.generatedAt), desc(gapReports.id)).limit(1);
  const open = await db
    .select({ id: suggestions.id, kind: suggestions.kind, subject: suggestions.subject, message: suggestions.message, createdAt: suggestions.createdAt })
    .from(suggestions)
    .where(and(eq(suggestions.status, "new"), sql`${suggestions.kind} in ('correction', 'add-distro')`))
    .orderBy(desc(suggestions.createdAt), desc(suggestions.id));
  return { report: latest?.report ?? null, suggestions: open.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) };
}
