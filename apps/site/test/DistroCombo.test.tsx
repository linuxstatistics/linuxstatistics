import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComparePicker } from "../src/components/ComparePicker";

afterEach(cleanup);

const options = [
  { slug: "mint", name: "Mint", rank: 2 },
  { slug: "ubuntu", name: "Ubuntu", rank: 9 },
  { slug: "ubuntu-mate", name: "Ubuntu MATE", rank: 70 },
  { slug: "hannah", name: "Hannah", rank: null },
];

test("each side is a searchable box; typing filters and Enter picks", async () => {
  const user = userEvent.setup();
  render(<ComparePicker options={options} staticPairs={["mint-vs-ubuntu"]} />);
  const first = screen.getByRole("combobox", { name: "First distro" });
  await user.click(first);
  // empty query lists ranked distros only
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Mint#2", "Ubuntu#9", "Ubuntu MATE#70"]);
  await user.type(first, "han");
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Hannah"]);
  await user.keyboard("{Enter}");
  expect(first).toHaveValue("Hannah");
  expect(screen.getByRole("button", { name: "Compare" })).toBeDisabled();
});

test("the second box leaves out the first choice and the pair opens its page", async () => {
  const user = userEvent.setup();
  const assign = vi.fn();
  vi.stubGlobal("location", { ...window.location, set href(v: string) { assign(v); }, search: "" });
  render(<ComparePicker options={options} staticPairs={["mint-vs-ubuntu"]} initialA="mint" />);
  const second = screen.getByRole("combobox", { name: "Second distro" });
  await user.click(second);
  expect(screen.getAllByRole("option").map((o) => o.textContent)).not.toContain("Mint#2");
  await user.type(second, "ubuntu");
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("button", { name: "Compare" }));
  expect(assign).toHaveBeenCalledWith("/compare/mint-vs-ubuntu/");
  vi.unstubAllGlobals();
});
