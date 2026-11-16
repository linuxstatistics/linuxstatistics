import { RANK_SOURCE } from "@linux-statistics/shared";
import { beforeAll, expect, test } from "vitest";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import {
  addPickerFeedback,
  addQuizCompletion,
  addSwitchReport,
  listQuizCompletions,
  removeQuizCompletion,
  addPopularitySnapshot,
  countPageView,
  getStats,
  insertDiscoveredDistro,
  replaceDistroReleases,
  upsertContribution,
  upsertDistro,
  upsertUser,
} from "../src/index.js";

let db: Database;
const now = new Date("2026-11-15T12:00:00.000Z");

beforeAll(async () => {
  ({ db } = await setupTestDb());
  const mint = await upsertDistro(db, { slug: "mint", name: "Linux Mint", family: "debian", status: "active" });
  const fedora = await upsertDistro(db, { slug: "fedora", name: "Fedora", family: "rpm", status: "active" });
  // Tracked but unlisted (no rank): counted as tracked only.
  await insertDiscoveredDistro(db, { slug: "hidden", name: "Hidden", family: "arch", status: "active" }, "wikidata");
  for (const id of [mint, fedora]) {
    await addPopularitySnapshot(db, id, { source: RANK_SOURCE, capturedAt: now, rank: id === mint ? 1 : 2, hitsPerDay: 100, period: "last-12-months" });
  }
  const rel = (cycle: string, releasedOn: string, eol: string | null) => ({ cycle, codename: null, releasedOn, latest: null, latestOn: null, supportEnds: null, eol, lts: false });
  await replaceDistroReleases(db, fedora, "endoflife", [rel("43", "2026-10-28", "2027-12-01"), rel("42", "2026-04-15", "2027-05-13"), rel("41", "2025-10-29", "2026-12-15")]);
  await replaceDistroReleases(db, mint, "endoflife", [rel("22.2", "2025-09-04", "2025-01-01")]);

  await countPageView(db, mint, "2026-11-10");
  await countPageView(db, mint, "2026-11-10");
  await countPageView(db, fedora, "2026-08-01");
  await addPickerFeedback(db, { topKey: "mint", code: "a", fit: true }, now);
  await addPickerFeedback(db, { topKey: "mint", code: "b", fit: false }, new Date("2026-06-01T00:00:00Z"));
  const u = await upsertUser(db, { provider: "github", providerUserId: "1", username: "u", avatarUrl: null, accountCreatedAt: null });
  await upsertContribution(db, { userId: u.id, distroId: mint, rating: 5, usesIt: true, reviewBody: null });

  const tok = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  await addQuizCompletion(db, { quiz: "pick", code: "121", topKey: "mint", token: tok(1) }, now);
  await addQuizCompletion(db, { quiz: "pick", code: "121", topKey: "mint", token: tok(1) }, now); // same visit: ignored
  await addQuizCompletion(db, { quiz: "start", code: "windows.pc.gaming.amd", topKey: "bazzite", token: tok(2) }, new Date("2026-05-01T00:00:00Z"));
  await addQuizCompletion(db, { quiz: "start", code: "mac.apple.everyday", topKey: "check", token: tok(3) }, now);
  await addSwitchReport(db, { cameFrom: "windows", nowUsing: "mint", page: "quiz" }, now);
  await addSwitchReport(db, { cameFrom: "windows", page: "distro" }, new Date("2026-03-01T00:00:00Z"));
  await addSwitchReport(db, { cameFrom: "macos", page: "switch" }, now);
});

test("stats count listed distros, families, releases and support ending soon", async () => {
  const s = await getStats(db, now);
  expect(s.trackedDistros).toBe(3);
  expect(s.listedDistros).toBe(2);
  expect(s.families).toEqual([{ family: "debian", count: 1 }, { family: "rpm", count: 1 }]);
  expect(s.releasesThisYear).toBe(2);
  expect(s.supportEndingSoon).toEqual([{ slug: "fedora", name: "Fedora", cycle: "41", endsOn: "2026-12-15" }]);
});

test("first-party counts give all-time and last-30-day totals", async () => {
  const s = await getStats(db, now);
  expect(s.site.pageViews).toEqual({ total: 3, last30d: 2 });
  expect(s.site.quizVotes).toEqual({ total: 2, last30d: 1 });
  expect(s.site.contributions.total).toBe(1);
  expect(s.site.switchers).toEqual({ total: 3, last30d: 2, byOrigin: [{ cameFrom: "windows", count: 2 }, { cameFrom: "macos", count: 1 }] });
});

test("quiz completions count once per visit and can be taken back with their token", async () => {
  expect((await getStats(db, now)).site.quizCompletions).toEqual({ total: 3, last30d: 2 });
  expect(await removeQuizCompletion(db, "00000000-0000-4000-8000-000000000003")).toBe(true);
  expect(await removeQuizCompletion(db, "00000000-0000-4000-8000-000000000003")).toBe(false);
  const rows = await listQuizCompletions(db);
  expect(rows.map((r) => r.topKey)).toEqual(["mint", "bazzite"]);
  expect(JSON.stringify(rows)).not.toMatch(/token|0000-4000/);
});

test("stats carry no third-party rank data", async () => {
  const json = JSON.stringify(await getStats(db, now));
  expect(json).not.toMatch(/"rank|hitsPerDay|distrowatch/i);
});
