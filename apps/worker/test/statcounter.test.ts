import { expect, test } from "vitest";
import { parseStatcounterCsv } from "../src/sources/statcounter.js";

const csv = `Date,Windows,macOS,Linux
2025-01,72.1,15.4,3.8
2025-02,71.6,15.6,4.0
2026-01,70.9,15.1,4.13`;

test("parses each platform column into share rows", () => {
  const rows = parseStatcounterCsv(csv);
  // 3 data rows x 3 platforms
  expect(rows).toHaveLength(9);
  const jan2026Linux = rows.find((r) => r.date === "2026-01" && r.platform === "linux");
  expect(jan2026Linux?.sharePct).toBeCloseTo(4.13, 2);
  const jan2025Win = rows.find((r) => r.date === "2025-01" && r.platform === "windows");
  expect(jan2025Win?.sharePct).toBeCloseTo(72.1, 2);
});

test("throws when the Date column is missing", () => {
  expect(() => parseStatcounterCsv("Windows,Linux\n70,4")).toThrow(/Date column/);
});

test("throws when there are no recognized platform columns", () => {
  expect(() => parseStatcounterCsv("Date,Foo\n2025-01,1")).toThrow(/platform columns/);
});
