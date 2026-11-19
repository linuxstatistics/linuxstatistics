import { afterAll, beforeAll, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  addEmailSignup,
  addPickerFeedback,
  addQuizCompletion,
  addSuggestion,
  addSwitchReport,
  adminGaps,
  adminSummary,
  initPgliteDb,
  quizStats,
  recentIngestionRuns,
  saveGapReport,
  schema,
  sourceHealth,
  type Database,
} from "../src/index.js";

let db: Database;
let client: PGlite;
const NOW = new Date("2026-11-18T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

beforeAll(async () => {
  const init = await initPgliteDb();
  db = init.db;
  client = init.client;
});

afterAll(async () => { await client.close(); });

test("summary counts the last 7 and 30 days, today included", async () => {
  await addQuizCompletion(db, { quiz: "pick", code: "a", topKey: "mint", token: "t1" }, NOW);
  await addQuizCompletion(db, { quiz: "pick", code: "a", topKey: "mint", token: "t2" }, daysAgo(6));
  await addQuizCompletion(db, { quiz: "start", code: "b", topKey: "fedora", token: "t3" }, daysAgo(7));
  await addQuizCompletion(db, { quiz: "start", code: "b", topKey: "fedora", token: "t4" }, daysAgo(30));
  await addPickerFeedback(db, { topKey: "mint", code: "a", fit: true }, NOW);
  await addPickerFeedback(db, { topKey: "mint", code: "a", fit: false }, daysAgo(20));
  await addSwitchReport(db, { cameFrom: "windows", nowUsing: "mint", page: "/pick/" }, daysAgo(2));
  await addEmailSignup(db, { email: "a@example.com", source: "/" });
  await addSuggestion(db, { kind: "idea", message: "more charts" });
  await db.insert(schema.affiliateClickDays).values([
    { partner: "linode", day: "2026-11-18", clicks: 3 },
    { partner: "linode", day: "2026-11-01", clicks: 2 },
    { partner: "linode", day: "2026-10-01", clicks: 9 },
  ]);

  const s = await adminSummary(db, NOW);
  expect(s.quizCompletions).toEqual({ last7: 2, last30: 3 });
  expect(s.fitYes).toEqual({ last7: 1, last30: 1 });
  expect(s.fitNo).toEqual({ last7: 0, last30: 1 });
  expect(s.switchReports).toEqual({ last7: 1, last30: 1 });
  expect(s.affiliateClicks).toEqual({ last7: 3, last30: 5 });
  expect(s.openSuggestions).toBe(1);
  expect(s.ratings).toEqual({ last7: 0, last30: 0 });
  // Signup was written with the real clock; it only has to land in one window or neither, never more.
  expect(s.emailSignups.last7).toBeLessThanOrEqual(s.emailSignups.last30);
});

test("source health flags late and failing sources and keeps the last error", async () => {
  await db.insert(schema.ingestionRuns).values([
    { source: "distrowatch", status: "success", rowsWritten: 100, startedAt: daysAgo(5), finishedAt: daysAgo(5) },
    { source: "github", status: "success", rowsWritten: 19, startedAt: daysAgo(2), finishedAt: daysAgo(2) },
    { source: "github", status: "failed", rowsWritten: 0, error: "HTTP 403", startedAt: daysAgo(1), finishedAt: daysAgo(1) },
    { source: "wikipedia", status: "failed", rowsWritten: 0, error: "timeout", startedAt: daysAgo(3), finishedAt: daysAgo(3) },
    { source: "wikipedia", status: "success", rowsWritten: 60, startedAt: daysAgo(2), finishedAt: daysAgo(2) },
  ]);
  const h = Object.fromEntries((await sourceHealth(db, NOW)).map((x) => [x.source, x]));
  expect(h.distrowatch).toMatchObject({ late: true, failing: false, cadenceDays: 1 });
  expect(h.github).toMatchObject({ late: false, failing: true, lastError: "HTTP 403" });
  expect(h.wikipedia).toMatchObject({ late: false, failing: false, lastError: "timeout" });
  // Never ran: nothing to be late about.
  expect(h.statcounter).toMatchObject({ lastSuccessAt: null, late: false, failing: false });

  const runs = await recentIngestionRuns(db, "github");
  expect(runs.map((r) => r.status)).toEqual(["failed", "success"]);
});

test("quiz stats fill zero days, rank picks and codes per quiz, and tally votes and switch reports", async () => {
  const q = await quizStats(db, NOW);
  expect(q.perDay).toHaveLength(30);
  expect(q.perDay.at(-1)).toEqual({ day: "2026-11-18", pick: 1, start: 0 });
  expect(q.perDay[0]!.day).toBe("2026-10-20");
  expect(q.perDay.reduce((a, d) => a + d.pick + d.start, 0)).toBe(3);
  expect(q.topPicks).toEqual([
    { quiz: "pick", topKey: "mint", n: 2 },
    { quiz: "start", topKey: "fedora", n: 2 },
  ]);
  expect(q.topCodes.find((c) => c.quiz === "pick")).toEqual({ quiz: "pick", code: "a", n: 2 });
  expect(q.fit).toEqual([{ topKey: "mint", yes: 1, n: 2 }]);
  expect(q.switchFrom).toEqual([{ key: "windows", n: 1 }]);
  expect(q.switchTo).toEqual([{ key: "mint", n: 1 }]);
  expect(q.totals).toEqual({ completions: 4, votes: 2, switchReports: 1 });
});

test("gap reports: newest is served, only the last 8 are kept, open corrections listed", async () => {
  expect((await adminGaps(db)).report).toBeNull();
  for (let i = 1; i <= 10; i++) await saveGapReport(db, { generatedAt: `2026-11-${String(i).padStart(2, "0")}T00:00:00.000Z`, n: i });
  const g = await adminGaps(db);
  expect(g.report).toMatchObject({ n: 10 });
  expect((await db.select().from(schema.gapReports)).length).toBe(8);
  await addSuggestion(db, { kind: "correction", subject: "mint", message: "wrong first release year" });
  await addSuggestion(db, { kind: "add-distro", message: "please add Foo OS to the list" });
  const kinds = (await adminGaps(db)).suggestions.map((s) => s.kind).sort();
  // The "idea" suggestion from the first test is not a data gap.
  expect(kinds).toEqual(["add-distro", "correction"]);
});
