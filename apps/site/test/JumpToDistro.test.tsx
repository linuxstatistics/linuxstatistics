import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JumpToDistro } from "../src/components/JumpToDistro";

afterEach(cleanup);

const items = [
  { slug: "mint", name: "Mint", rank: 2 },
  { slug: "linuxlite", name: "Linux Lite", rank: 40 },
  { slug: "mx", name: "MX Linux", rank: 3 },
];

test("filters by name, prefix matches first, then by rank", async () => {
  const user = userEvent.setup();
  render(<JumpToDistro items={items} />);
  await user.type(screen.getByRole("combobox"), "li");
  const names = screen.getAllByRole("option").map((o) => o.textContent);
  expect(names).toEqual(["Linux Lite#40", "MX Linux#3"]);
});

test("slash focuses the box", async () => {
  const user = userEvent.setup();
  render(<JumpToDistro items={items} />);
  await user.keyboard("/");
  expect(screen.getByRole("combobox")).toHaveFocus();
});
