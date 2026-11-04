import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { DistroListItem } from "@linux-statistics/shared";
import { DistroHighlights } from "../src/components/DistroHighlights";

afterEach(cleanup);

const items: DistroListItem[] = [
  { slug: "mint", name: "Linux Mint", family: "debian", status: "active", rank: 1, hitsPerDay: 2600, stars: 5200, commitsLast30d: 180, firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", rankTrend: 2, rank1m: null, rank1mDelta: null, userRating: { average: 4.6, count: 10, mean: 4.6, verifiedCount: 10 }, usesItCount: 22 },
  { slug: "fedora", name: "Fedora", family: "rpm", status: "active", rank: 3, hitsPerDay: 1700, stars: 1300, commitsLast30d: 60, firstReleaseYear: 2003, repoFullName: null, rankTrend: -1, rank1m: null, rank1mDelta: null, userRating: { average: 3.9, count: 4, mean: 3.9, verifiedCount: 4 }, usesItCount: 8 },
  { slug: "cachyos", name: "CachyOS", family: "arch", status: "active", rank: 16, hitsPerDay: 660, stars: 380, commitsLast30d: 33, firstReleaseYear: 2021, repoFullName: "CachyOS/x", rankTrend: 9, rank1m: null, rank1mDelta: null, userRating: { average: 4.2, count: 6, mean: 4.2, verifiedCount: 6 }, usesItCount: 15 },
];

test("shows the top-ranked distro", () => {
  render(<DistroHighlights items={items} />);
  expect(screen.getByText("Top distro")).toBeInTheDocument();
  expect(screen.getByText("Linux Mint")).toBeInTheDocument();
  expect(screen.getByText("#1 on DistroWatch")).toBeInTheDocument();
});

test("shows the biggest climber by rank trend", () => {
  render(<DistroHighlights items={items} />);
  expect(screen.getByText("CachyOS")).toBeInTheDocument();
  expect(screen.getByText("▲ 9 spots this year")).toBeInTheDocument();
});

test("renders nothing without data", () => {
  const { container } = render(<DistroHighlights items={[]} />);
  expect(container.firstChild).toBeNull();
});
