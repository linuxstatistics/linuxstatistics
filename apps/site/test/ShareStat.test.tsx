import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ShareStat } from "../src/components/ShareStat";
import type { YearlySharePoint } from "../src/lib/marketShare";

afterEach(cleanup);

const series: YearlySharePoint[] = [
  { year: 2010, value: 0.9 },
  { year: 2018, value: 1.9 },
  { year: 2026, value: 4.13 },
];

test("shows the latest share value and year", () => {
  render(<ShareStat series={series} />);
  expect(screen.getByText("4.13%")).toBeInTheDocument();
  expect(screen.getByText(/2026/)).toBeInTheDocument();
});

test("shows a growth chip relative to the first year", () => {
  render(<ShareStat series={series} />);
  // 4.13 - 0.9 = 3.2 pts since 2010
  expect(screen.getByText(/\+3\.2 pts since 2010/)).toBeInTheDocument();
});

test("renders a dash and no growth chip with no data", () => {
  render(<ShareStat series={[]} />);
  expect(screen.getByText("-")).toBeInTheDocument();
  expect(screen.queryByText(/since/)).not.toBeInTheDocument();
});

test("yearly series averages months and the chart colours by direction", async () => {
  const { linuxYearlySeries, chartPaths } = await import("../src/lib/marketShare");
  const pt = (d: string, v: number) => ({ capturedAt: d, region: "global", platform: "linux", sharePct: v }) as never;
  const s = linuxYearlySeries([pt("2024-01-01", 2), pt("2024-02-01", 4), pt("2025-01-01", 5)]);
  expect(s).toEqual([{ year: 2024, value: 3, months: 2 }, { year: 2025, value: 5, months: 1 }]);
  expect(chartPaths([1], 100, 50)).toBeNull();
  expect(chartPaths([1, 2, 3], 100, 50)!.line.startsWith("M")).toBe(true);
  const { ShareChart } = await import("../src/components/ShareChart");
  const { container } = render(<ShareChart series={[{ year: 2020, value: 2, months: 12 }, { year: 2021, value: 1, months: 3 }]} />);
  expect(container.querySelector(".is-down")).not.toBeNull();
  expect(container.querySelector("svg")!.getAttribute("aria-label")).toMatch(/fell from 2.00% in 2020 to 1.00% in 2021 so far/);
});
