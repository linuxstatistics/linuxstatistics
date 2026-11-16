import { asc, eq } from "drizzle-orm";
import type { QuizCompletionInput, SwitchReportInput } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import { quizCompletions, siteMetrics, switchReports } from "./schema.js";

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Record one finished quiz. A repeated token (same page visit) is ignored. */
export async function addQuizCompletion(
  db: Database,
  input: Pick<QuizCompletionInput, "quiz" | "code" | "topKey" | "token">,
  now: Date = new Date(),
): Promise<void> {
  await db
    .insert(quizCompletions)
    .values({ quiz: input.quiz, code: input.code, topKey: input.topKey, token: input.token, day: isoDay(now) })
    .onConflictDoNothing({ target: quizCompletions.token });
}

/** "Don't count my answers": remove the row this visit sent. Returns whether one was removed. */
export async function removeQuizCompletion(db: Database, token: string): Promise<boolean> {
  const rows = await db.delete(quizCompletions).where(eq(quizCompletions.token, token)).returning({ id: quizCompletions.id });
  return rows.length > 0;
}

export interface QuizCompletionRow {
  id: number;
  day: string;
  quiz: string;
  code: string;
  topKey: string;
}

/** All completions, oldest first, for admin export. Tokens are left out. */
export async function listQuizCompletions(db: Database): Promise<QuizCompletionRow[]> {
  return db
    .select({ id: quizCompletions.id, day: quizCompletions.day, quiz: quizCompletions.quiz, code: quizCompletions.code, topKey: quizCompletions.topKey })
    .from(quizCompletions)
    .orderBy(asc(quizCompletions.id));
}

export async function addSwitchReport(
  db: Database,
  input: Pick<SwitchReportInput, "cameFrom" | "nowUsing" | "page">,
  now: Date = new Date(),
): Promise<void> {
  await db.insert(switchReports).values({ cameFrom: input.cameFrom, nowUsing: input.nowUsing ?? null, page: input.page, day: isoDay(now) });
}

export interface SwitchReportRow {
  id: number;
  day: string;
  cameFrom: string;
  nowUsing: string | null;
  page: string;
}

export async function listSwitchReports(db: Database): Promise<SwitchReportRow[]> {
  return db
    .select({ id: switchReports.id, day: switchReports.day, cameFrom: switchReports.cameFrom, nowUsing: switchReports.nowUsing, page: switchReports.page })
    .from(switchReports)
    .orderBy(asc(switchReports.id));
}

/** Our own repository's numbers, written by the GitHub ingest. */
export const OWN_REPO_KEYS = ["repo_stars", "repo_contributors", "repo_forks"] as const;
export type OwnRepoKey = (typeof OWN_REPO_KEYS)[number];

export async function setSiteMetrics(db: Database, values: Partial<Record<OwnRepoKey, number>>, now: Date = new Date()): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    if (value == null) continue;
    await db
      .insert(siteMetrics)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({ target: siteMetrics.key, set: { value, updatedAt: now } });
  }
}

export async function getSiteMetrics(db: Database): Promise<Partial<Record<OwnRepoKey, number>>> {
  const rows = await db.select().from(siteMetrics);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
