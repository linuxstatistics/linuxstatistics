import { expect, test } from "vitest";
import { changeRows, lastYears, niceTicks, summaries, yearlyByOs } from "../src/lib/share-compare";

const pt = (d: string, platform: string, v: number) => ({ capturedAt: d, region: "global", platform, sharePct: v }) as never;
const points = [
  pt("2020-01-01", "windows", 80), pt("2020-02-01", "windows", 78), pt("2020-01-01", "macos", 15), pt("2020-01-01", "linux", 2),
  pt("2021-01-01", "windows", 75), pt("2021-01-01", "macos", 18), pt("2021-01-01", "linux", 4), pt("2021-01-01", "other", 3),
  pt("2022-01-01", "linux", 5),
];

test("yearly averages per OS, dropping incomplete years", () => {
  const rows = yearlyByOs(points);
  expect(rows.map((r) => r.year)).toEqual([2020, 2021]);
  expect(rows[0]!.values).toEqual({ windows: 79, macos: 15, linux: 2 });
  expect(rows[0]!.months).toBe(2);
});

test("growth view and summaries", () => {
  const rows = yearlyByOs(points);
  expect(changeRows(rows)[1]!.values).toEqual({ windows: -4, macos: 3, linux: 2 });
  const s = summaries(rows);
  expect(s.find((x) => x.os === "linux")).toMatchObject({ delta: 2, ratio: 2 });
  expect(lastYears(rows, 0)).toHaveLength(2);
  expect(lastYears([...rows, ...rows], 1)).toHaveLength(2);
});

test("axis ticks are round and include zero", () => {
  expect(niceTicks(0.7, 95)).toEqual([0, 20, 40, 60, 80, 100]);
  const t = niceTicks(-20, 14);
  expect(t).toContain(0);
  expect(t[0]).toBeLessThanOrEqual(-20);
  expect(t[t.length - 1]).toBeGreaterThanOrEqual(14);
});
