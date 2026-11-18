import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DistroListItem } from "@linux-statistics/shared";
import { ListView } from "../src/components/ListView";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const items: DistroListItem[] = [
  { slug: "mint", name: "Linux Mint", family: "debian", status: "active", rank: 1, hitsPerDay: 2600, stars: 5200, commitsLast30d: 180, firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", rankTrend: 2, rank1m: null, rank1mDelta: null, userRating: { average: 4.6, count: 10, mean: 4.6, verifiedCount: 10 }, usesItCount: 22, defaultDesktop: null, otherDesktops: [] },
  { slug: "fedora", name: "Fedora", family: "rpm", status: "active", rank: 3, hitsPerDay: 1700, stars: 1300, commitsLast30d: 60, firstReleaseYear: 2003, repoFullName: null, rankTrend: -1, rank1m: null, rank1mDelta: null, userRating: { average: 3.9, count: 4, mean: 3.9, verifiedCount: 4 }, usesItCount: 8, defaultDesktop: null, otherDesktops: [] },
  { slug: "arch", name: "Arch Linux", family: "arch", status: "active", rank: 2, hitsPerDay: 840, stars: 4100, commitsLast30d: 70, firstReleaseYear: 2002, repoFullName: "archlinux/archinstall", rankTrend: 1, rank1m: null, rank1mDelta: null, userRating: { average: 4.2, count: 6, mean: 4.2, verifiedCount: 6 }, usesItCount: 15, defaultDesktop: null, otherDesktops: [] },
];

// Distro name is the second cell of each data row.
function rowNames(): string[] {
  const rows = screen.getAllByRole("row").slice(1); // drop header
  return rows.map((r) => within(r).getAllByRole("cell")[1]?.querySelector("a")?.textContent?.trim() ?? "");
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

test("rows without a value stay last in both sort directions", async () => {
  const user = userEvent.setup();
  const withMissing = [...items, { ...items[1]!, slug: "void", name: "Void", rank: 4, stars: null }];
  render(<ListView items={withMissing} />);
  const github = screen.getByRole("button", { name: /GitHub/ });
  await user.click(github);
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora", "Void"]);
  await user.click(github);
  expect(rowNames()).toEqual(["Fedora", "Arch Linux", "Linux Mint", "Void"]);
});

test("sorting by Family starts A to Z", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  await user.click(screen.getByRole("button", { name: /Family/ }));
  // arch, debian, rpm
  expect(rowNames()).toEqual(["Arch Linux", "Linux Mint", "Fedora"]);
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
  // The GitHub link lives on the distro page.
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

test("Rating is off by default and sortable once turned on", async () => {
  const user = userEvent.setup();
  render(<ListView items={items} />);
  expect(screen.queryByRole("columnheader", { name: /Rating/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Choose columns" }));
  await user.click(screen.getByRole("checkbox", { name: "Rating" }));
  expect(screen.getByRole("columnheader", { name: /Rating/ })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Rating/ }));
  // rating average descending: Mint(4.6), Arch(4.2), Fedora(3.9)
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora"]);
});

test("every name shows its logo inside the name link; there is no separate Logo column", async () => {
  const user = userEvent.setup();
  const { container } = render(<ListView items={items} />);
  expect(screen.queryByRole("columnheader", { name: "Logo" })).not.toBeInTheDocument();
  expect(container.querySelectorAll("td.distro-name-cell a.with-mark .dmark")).toHaveLength(3);
  await user.click(screen.getByRole("button", { name: "Choose columns" }));
  expect(screen.queryByRole("checkbox", { name: "Logo" })).not.toBeInTheDocument();
});

test("tags secondary columns to be hidden on mobile", () => {
  render(<ListView items={items} />);
  const hits = screen.getByRole("columnheader", { name: /^Interest score/ });
  const stars = screen.getByRole("columnheader", { name: /GitHub/ });
  const distro = screen.getByRole("columnheader", { name: /Distro/ });
  // The index value and the 1-month move stay on phones; secondary columns hide.
  expect(hits).not.toHaveClass("col-hide-mobile");
  expect(screen.getByRole("columnheader", { name: /1 mo/ })).not.toHaveClass("col-hide-mobile");
  expect(stars).toHaveClass("col-hide-mobile");
  expect(distro).not.toHaveClass("col-hide-mobile");
});

test("each distro name links to its page", () => {
  render(<ListView items={items} />);
  expect(screen.getByRole("link", { name: "Arch Linux" })).toHaveAttribute("href", "/distro/arch/");
});

test("caps rows and loads more on demand; search still covers every row", async () => {
  const many = Array.from({ length: 25 }, (_, i) => ({
    ...items[0]!,
    slug: `d${i}`,
    name: `Distro ${String(i).padStart(2, "0")}`,
    rank: i + 1,
  }));
  const user = userEvent.setup();
  render(<ListView items={many} pageSize={10} />);
  const bodyRows = () => screen.getAllByRole("row").length - 1;
  expect(bodyRows()).toBe(10);
  expect(screen.getByText("Showing 10 of 25")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Show next 10" }));
  expect(bodyRows()).toBe(20);
  await user.click(screen.getByRole("button", { name: "Show next 5" }));
  expect(bodyRows()).toBe(25);
  expect(screen.queryByRole("button", { name: /Show next/ })).not.toBeInTheDocument();
});

test("search finds distros beyond the cap", async () => {
  const many = Array.from({ length: 25 }, (_, i) => ({ ...items[0]!, slug: `d${i}`, name: `Distro ${i}`, rank: i + 1 }));
  const user = userEvent.setup();
  render(<ListView items={many} pageSize={10} />);
  await user.type(screen.getByRole("searchbox", { name: "Search distros" }), "Distro 24");
  expect(screen.getByRole("link", { name: "Distro 24" })).toBeInTheDocument();
});

test("first batch can differ and totals include rows shown elsewhere", async () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ ...items[0]!, slug: `e${i}`, name: `E ${i}`, rank: i + 4 }));
  const user = userEvent.setup();
  render(<ListView items={many} firstPage={7} pageSize={10} offset={3} />);
  expect(screen.getByText("Showing 10 of 33")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Show next 10" }));
  expect(screen.getByText("Showing 20 of 33")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show all 33" })).toBeInTheDocument();
});

test("hits bars scale linearly with a visible minimum", async () => {
  const { hitsBarPct } = await import("../src/components/ListView");
  expect(hitsBarPct(1600, 3200)).toBe(50);
  expect(hitsBarPct(10, 3200)).toBe(2);
  expect(hitsBarPct(null, 3200)).toBe(0);
});

test("with src, the first page is in the HTML and the rest loads after hydration", async () => {
  const { packList, resetDistroList } = await import("../src/lib/distro-list");
  resetDistroList();
  const all = Array.from({ length: 30 }, (_, i) => ({ ...items[0]!, slug: `f${i}`, name: `F ${String(i).padStart(2, "0")}`, rank: i + 1 }));
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(packList(all))));
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  // The podium shows #1–#3; the table starts at #4.
  render(<ListView items={all.slice(3, 10)} src="/lists/distros.json" exclude={["f0", "f1", "f2"]} total={27} firstPage={7} pageSize={10} offset={3} />);
  expect(screen.getByText("Showing 10 of 30")).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Show next 10" })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/lists/distros.json");
  await user.click(screen.getByRole("button", { name: "Show all 30" }));
  expect(screen.getAllByRole("row")).toHaveLength(28);
  expect(screen.queryByRole("link", { name: "F 00" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "F 29" })).toBeInTheDocument();
  vi.unstubAllGlobals();
  resetDistroList();
});

test("with src, a failed load keeps the rows the page rendered", async () => {
  const { resetDistroList } = await import("../src/lib/distro-list");
  resetDistroList();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
  render(<ListView items={items} src="/lists/distros.json" total={3} />);
  await new Promise((r) => setTimeout(r, 0));
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora"]);
  vi.unstubAllGlobals();
  resetDistroList();
});

test("rows can come as a packed string (small island props) and render the same", async () => {
  const { packList } = await import("../src/lib/distro-list");
  render(<ListView packed={JSON.stringify(packList(items))} />);
  expect(rowNames()).toEqual(["Linux Mint", "Arch Linux", "Fedora"]);
});

test("the name cell carries the family as a phone-only line, hidden from screen readers", () => {
  const { container } = render(<ListView items={items} />);
  const sub = container.querySelector("td.distro-name-cell .name-sub");
  expect(sub).toHaveTextContent("debian");
  expect(sub).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector("th.col-family")).toHaveClass("col-hide-mobile");
});
