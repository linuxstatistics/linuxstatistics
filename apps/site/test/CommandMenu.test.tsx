import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandMenu } from "../src/components/CommandMenu";
import { PAGE_COMMANDS, compareHref, groupCommands, searchCommands } from "../src/lib/command-menu";

afterEach(cleanup);

const items = [
  { slug: "mint", name: "Mint", rank: 2 },
  { slug: "fedora", name: "Fedora", rank: 4 },
  { slug: "mx", name: "MX Linux", rank: 3 },
  { slug: "zzz", name: "Zzz OS", rank: null },
];

test("empty query is the menu: every page, then the top distros by rank, actions and accounts", () => {
  const r = searchCommands("", items);
  expect(r[0]).toMatchObject({ kind: "page", href: "/" });
  expect(r.filter((c) => c.kind === "page")).toHaveLength(PAGE_COMMANDS.length);
  expect(r.filter((c) => c.kind === "distro").map((c) => c.label)).toEqual(["Mint", "MX Linux", "Fedora"]);
  expect(groupCommands(r).map((g) => g.kind)).toEqual(["page", "distro", "action", "link"]);
  expect(r.at(-1)).toMatchObject({ kind: "link", href: "https://mastodon.social/@linuxstatistics" });
});

test("typing puts the best-matching group first", () => {
  expect(groupCommands(searchCommands("mint", items))[0]!.kind).toBe("distro");
  expect(groupCommands(searchCommands("rising", items))[0]!.kind).toBe("page");
  expect(searchCommands("bluesky", items)[0]).toMatchObject({ kind: "link", label: "Follow on Bluesky" });
});

test("typing a name finds distros and pages by keyword", () => {
  expect(searchCommands("fed", items)[0]).toMatchObject({ kind: "distro", href: "/distro/fedora/" });
  expect(searchCommands("quiz", items).map((c) => c.label)).toContain("Which distro? Take the quiz");
  expect(searchCommands("apple silicon", items)[0]).toMatchObject({ href: "/switch/mac/" });
});

test("'a vs b' becomes a comparison, prerendered page when it exists", () => {
  const prerendered = new Set(["fedora-vs-mint"]);
  expect(searchCommands("mint vs fedora", items, prerendered)[0]).toEqual({
    kind: "compare", id: "compare:fedora-vs-mint", label: "Mint vs Fedora", href: "/compare/fedora-vs-mint/",
  });
  expect(compareHref("mint", "mx", prerendered)).toBe("/compare/?a=mint&b=mx");
  expect(searchCommands("mint vs mint", items).some((c) => c.kind === "compare")).toBe(false);
});

test("every page command points at a site path", () => {
  for (const p of PAGE_COMMANDS) expect(p.href).toMatch(/^\/([a-z-]+\/)*$/);
});

test("Ctrl+K opens the menu with focus in the search box; arrows move the selection", async () => {
  const user = userEvent.setup();
  render(<CommandMenu items={items} />);
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  await user.keyboard("{Control>}k{/Control}");
  const box = screen.getByRole("combobox");
  expect(box).toHaveFocus();
  await user.type(box, "m");
  const options = screen.getAllByRole("option");
  expect(options.length).toBeGreaterThan(1);
  expect(options[0]).toHaveTextContent("Mint");
  expect(options[0]).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{ArrowDown}");
  expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "false");
  expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

test("the header button opens the menu and shows a way out when nothing matches", async () => {
  const user = userEvent.setup();
  render(<CommandMenu items={items} />);
  await user.click(screen.getByRole("button", { name: /menu and search/i }));
  await user.type(screen.getByRole("combobox"), "qwertyuiop");
  expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /suggest a distro/i })).toHaveAttribute("href", "/suggest/?kind=distro");
});

test("a tap on the header button opens the menu without focusing the search box", async () => {
  const user = userEvent.setup();
  render(<CommandMenu items={items} />);
  await user.pointer({ keys: "[TouchA]", target: screen.getByRole("button", { name: /menu and search/i }) });
  const box = screen.getByRole("combobox");
  expect(box).not.toHaveFocus();
  expect(document.documentElement).toHaveClass("cmdk-open");
  await user.keyboard("{Escape}");
});

test("slash opens it; results are grouped with titles in display order", async () => {
  const user = userEvent.setup();
  render(<CommandMenu items={items} />);
  await user.keyboard("/");
  const box = screen.getByRole("combobox");
  expect(box).toHaveFocus();
  expect(box).toBeInTheDocument();
  // Empty query: pages first, then distros, actions and accounts, each under its own title.
  const groups = screen.getAllByRole("group");
  expect(groups.map((g) => g.getAttribute("aria-labelledby") && document.getElementById(g.getAttribute("aria-labelledby")!)?.textContent)).toEqual(["Pages", "Distros", "Actions", "Follow"]);
  // Arrow order follows the visual order: the first option is the first page.
  expect(screen.getAllByRole("option")[0]).toHaveTextContent("Rankings");
  await user.type(box, "mint vs fedora");
  expect(screen.getAllByRole("group")[0]).toHaveTextContent("Compare");
});
