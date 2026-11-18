import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { DistroListItem } from "@linux-statistics/shared";
import { Podium } from "../src/components/Podium";

afterEach(cleanup);

const d = (slug: string, name: string, family: DistroListItem["family"], rank: number | null, hitsPerDay: number, rank1mDelta: number | null) =>
  ({ slug, name, family, rank, hitsPerDay, rank1mDelta }) as DistroListItem;

const items = [d("mint", "Mint", "debian", 2, 936, 0), d("zorin", "Zorin OS", "debian", 3, 845, -2), d("arch", "Arch", "arch", 1, 952, 0), d("popos", "Pop!_OS", "debian", 4, 862, 1), d("x", "Unranked", "other", null, 1, null)];

test("renders the top three as an ordered list in rank order", () => {
  render(<Podium items={items} />);
  const list = screen.getByRole("list", { name: "Top 3 distros" });
  expect(list.tagName).toBe("OL");
  const links = within(list).getAllByRole("link");
  expect(links.map((a) => a.getAttribute("href"))).toEqual(["/distro/arch/", "/distro/mint/", "/distro/zorin/"]);
});

test("card text reads with spaces between rank, name, family and score", () => {
  render(<Podium items={items} />);
  const first = screen.getAllByRole("link")[0]!;
  const text = first.textContent!.replace(/\s+/g, " ").trim();
  expect(text).toMatch(/^Rank 1 Arch arch family 952 interest score/);
  expect(first.querySelector("[aria-label]")).toBeNull();
});
