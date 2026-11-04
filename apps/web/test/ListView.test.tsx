import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DistroListItem } from "@linux-statistics/shared";
import { ListView } from "../src/components/ListView";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function withClient(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

const items: DistroListItem[] = [
  { slug: "mint", name: "Linux Mint", family: "debian", status: "active", rank: 1, hitsPerDay: 2600, stars: 5200, commitsLast30d: 180, firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", rankTrend: 2, userRating: { average: 4.6, count: 10 }, usesItCount: 22 },
  { slug: "fedora", name: "Fedora", family: "rpm", status: "active", rank: 3, hitsPerDay: 1700, stars: 1300, commitsLast30d: 60, firstReleaseYear: 2003, repoFullName: null, rankTrend: -1, userRating: { average: 3.9, count: 4 }, usesItCount: 8 },
  { slug: "arch", name: "Arch Linux", family: "arch", status: "active", rank: 2, hitsPerDay: 840, stars: 4100, commitsLast30d: 70, firstReleaseYear: 2002, repoFullName: "archlinux/archinstall", rankTrend: 1, userRating: { average: 4.2, count: 6 }, usesItCount: 15 },
];

// Distro name is the second cell of each data row.
function rowNames(): string[] {
  const rows = screen.getAllByRole("row").slice(1); // drop header
  return rows.map((r) => within(r).getAllByRole("cell")[1]?.textContent?.trim() ?? "");
}

test("renders rows sorted by rank ascending by default", () => {
  render(<ListView items={items} />);
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora"]);
});

test("sorting by GitHub stars reorders rows", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  await user.click(screen.getByRole("button", { name: /GitHub/ }));
  // numeric columns default to descending (highest first): Mint(5200), Arch(4100), Fedora(1300)
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora"]);
});

test("sorting by Trend orders by biggest climber", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  await user.click(screen.getByRole("button", { name: /Trend/ }));
  // rankTrend descending: Mint(+2), Arch(+1), Fedora(-1)
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora"]);
});

test("search filters by name", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  await user.type(screen.getByLabelText("Search distros"), "arch");
  expect(rowNames()).toEqual(["Arch Linux"]);
});

test("family filter narrows the list", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  await user.selectOptions(screen.getByLabelText("Filter by family"), "rpm");
  expect(rowNames()).toEqual(["Fedora"]);
});

test("shows GitHub stars as plain text (no link in the row)", () => {
  render(<ListView items={items} />);
  expect(screen.getByText("5,200")).toBeInTheDocument();
  // The GitHub link now lives only in the expanded detail pane.
  expect(screen.queryByRole("link", { name: "5,200" })).not.toBeInTheDocument();
});

test("includes a Released column", () => {
  render(<ListView items={items} />);
  expect(screen.getByRole("columnheader", { name: /Released/ })).toBeInTheDocument();
  expect(screen.getByText("2006")).toBeInTheDocument();
});

test("the Columns menu hides a column", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  expect(screen.getByRole("columnheader", { name: /Trend/ })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Choose columns" }));
  await user.click(screen.getByRole("checkbox", { name: "Trend" }));
  expect(screen.queryByRole("columnheader", { name: /Trend/ })).not.toBeInTheDocument();
});

test("includes a sortable Rating column", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  expect(screen.getByRole("columnheader", { name: /Rating/ })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Rating/ }));
  // rating average descending: Mint(4.6), Arch(4.2), Fedora(3.9)
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora"]);
});

test("tags secondary columns to be hidden on mobile", () => {
  render(<ListView items={items} />);
  const hits = screen.getByRole("columnheader", { name: /Hits\/day/ });
  const commits = screen.getByRole("columnheader", { name: /Commits\/mo/ });
  const distro = screen.getByRole("columnheader", { name: /Distro/ });
  expect(hits).toHaveClass("col-hide-mobile");
  expect(commits).toHaveClass("col-hide-mobile");
  expect(distro).not.toHaveClass("col-hide-mobile");
});

test("clicking a row expands an inline detail row", async () => {
  const archDetail = {
    slug: "arch", name: "Arch Linux", family: "arch", status: "active",
    rank: 2, hitsPerDay: 840, stars: 4100, commitsLast30d: 70,
    firstReleaseYear: 2002, repoFullName: "archlinux/archinstall", rankTrend: 1,
    userRating: { average: 4.2, count: 6 }, usesItCount: 15,
    basedOnSlug: null, homepage: "https://archlinux.org", logoUrl: null,
    rankHistory: [], starsHistory: [], myContribution: null,
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => archDetail }));
  const user = userEvent.setup();
  render(withClient(<ListView items={items} />));
  await user.click(screen.getByRole("row", { name: /Arch Linux/ }));
  // The expanded detail body renders distro stats below the row.
  expect(await screen.findByText("DistroWatch rank")).toBeInTheDocument();
});
