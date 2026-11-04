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
  expect(screen.getByText("—")).toBeInTheDocument();
  expect(screen.queryByText(/since/)).not.toBeInTheDocument();
});
