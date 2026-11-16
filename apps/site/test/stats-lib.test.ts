import { expect, test } from "vitest";
import type { MarketSharePoint, StatsPayload } from "@linux-statistics/shared";
import { familyBars, linuxShareChange, shareSeries, showSiteStats } from "../src/lib/stats";

const pt = (capturedAt: string, platform: MarketSharePoint["platform"], sharePct: number): MarketSharePoint =>
  ({ capturedAt, platform, sharePct, region: "global" }) as MarketSharePoint;

const points = [
  pt("2024-01-01T00:00:00Z", "linux", 3.7),
  pt("2025-01-01T00:00:00Z", "linux", 4),
  pt("2025-10-01T00:00:00Z", "linux", 4.1),
  pt("2026-01-01T00:00:00Z", "linux", 4.5),
  pt("2026-08-01T00:00:00Z", "linux", 8.76),
  pt("2026-10-01T00:00:00Z", "linux", 5.66),
  pt("2026-10-01T00:00:00Z", "macos", 15.7),
];

test("share series: one point per year plus the latest month, so single-month spikes don't show", () => {
  const s = shareSeries(points);
  expect(s.linux.map((p) => p.value)).toEqual([3.7, 4, 4.5, 5.66]);
  expect(s.linux.at(-1)!.t).toBeCloseTo(2026.75);
});

test("Linux share change compares with the same month a year earlier", () => {
  expect(linuxShareChange(points)).toEqual({ value: 5.66, label: "Oct 2026", delta: 1.56 });
});

const stats = (last30d: number): StatsPayload => ({
  generatedAt: "2026-11-15T00:00:00.000Z",
  trackedDistros: 3,
  listedDistros: 2,
  families: [{ family: "other", count: 400 }, { family: "debian", count: 48 }, { family: "arch", count: 12 }],
  github: { repos: 0, stars: 0, commitsLast30d: 0 },
  releasesThisYear: 0,
  supportEndingSoon: [],
  site: {
    pageViews: { total: 5000, last30d },
    quizVotes: { total: 0, last30d: 0 },
    quizCompletions: { total: 0, last30d: 0 },
    contributions: { total: 0, last30d: 0 },
    switchers: { total: 0, last30d: 0, byOrigin: [] },
  },
});

test("the This site section needs enough recent views, not just an all-time total", () => {
  expect(showSiteStats(stats(999), 1000)).toBe(false);
  expect(showSiteStats(stats(1000), 1000)).toBe(true);
});

test("family bars leave out 'other' and scale to the largest known family", () => {
  expect(familyBars(stats(0))).toEqual({ bars: [{ family: "debian", count: 48, pct: 100 }, { family: "arch", count: 12, pct: 25 }], other: 400 });
});
