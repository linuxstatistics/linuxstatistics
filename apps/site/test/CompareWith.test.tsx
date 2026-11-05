import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompareWith } from "../src/components/CompareWith";

afterEach(cleanup);

const items = [
  { slug: "mint", name: "Mint", rank: 2 },
  { slug: "ubuntu", name: "Ubuntu", rank: 9 },
  { slug: "ubuntu-mate", name: "Ubuntu MATE", rank: 70 },
];

test("results link to the pair, prerendered page when there is one, and skip itself", async () => {
  const user = userEvent.setup();
  render(<CompareWith self={{ slug: "mint", name: "Mint" }} items={items} staticPairs={["mint-vs-ubuntu"]} />);
  const box = screen.getByRole("combobox", { name: "Compare Mint with" });
  await user.type(box, "u");
  const links = screen.getAllByRole("link");
  expect(links.map((l) => l.getAttribute("href"))).toEqual(["/compare/mint-vs-ubuntu/", "/compare/?a=mint&b=ubuntu-mate"]);
  await user.clear(box);
  await user.type(box, "min");
  expect(screen.queryAllByRole("option")).toHaveLength(0);
});
