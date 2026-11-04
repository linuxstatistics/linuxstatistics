import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { expect, test } from "vitest";
import { parseStatcounterCsv, statcounterCsvUrl } from "../src/sources/statcounter.js";

const here = dirname(fileURLToPath(import.meta.url));
// Rows taken from StatCounter's desktop OS CSV (worldwide), fetched 2026-11-03.
const live = readFileSync(resolve(here, "fixtures/statcounter-desktop-ww-2026-11-03.csv"), "utf8");

const csv = `Date,Windows,macOS,Linux
2025-01,72.1,15.4,3.8
2025-02,71.6,15.6,4.0
2026-01,70.9,15.1,4.13`;

test("parses each platform column into share rows", () => {
  const rows = parseStatcounterCsv(csv);
  expect(rows).toHaveLength(9);
  const jan2026Linux = rows.find((r) => r.date === "2026-01" && r.platform === "linux");
  expect(jan2026Linux?.sharePct).toBeCloseTo(4.13, 2);
});

test("live format: quoted headers, OS X + macOS summed, Chrome OS etc. go to other", () => {
  const rows = parseStatcounterCsv(live);
  const sep = rows.filter((r) => r.date === "2026-09");
  const by = Object.fromEntries(sep.map((r) => [r.platform, r.sharePct]));
  expect(by.windows).toBeCloseTo(76.41, 2);
  expect(by.linux).toBeCloseTo(4.54, 2);
  expect(by.macos).toBeCloseTo(10.65 + 6.09, 2);
  expect(by.other).toBeCloseTo(2.31, 2);
  // one row per platform per month
  expect(sep).toHaveLength(4);
});

test("a header-only CSV (no data for the region) is an error, not an empty success", () => {
  expect(() => parseStatcounterCsv('"Date",""\n2026-01\n2026-02')).toThrow(/platform columns/);
});

test("builds the desktop CSV URL for a region and month range", () => {
  const url = new URL(statcounterCsvUrl("ww", "2009-01", "2026-10"));
  expect(url.pathname).toBe("/os-market-share/desktop/worldwide/chart.php");
  expect(url.searchParams.get("csv")).toBe("1");
  expect(url.searchParams.get("fromInt")).toBe("200901");
  expect(url.searchParams.get("toInt")).toBe("202610");
});

test("throws when the Date column is missing", () => {
  expect(() => parseStatcounterCsv("Windows,Linux\n70,4")).toThrow(/Date column/);
});

test("throws when there are no recognized platform columns", () => {
  expect(() => parseStatcounterCsv("Date,Foo\n2025-01,1")).toThrow(/platform columns/);
});
