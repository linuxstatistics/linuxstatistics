import { expect, test } from "vitest";
import type { DistroListItem } from "@linux-statistics/shared";
import { compareSlug, parseCompareSlug, popularPairs } from "../src/lib/compare";

const item = (slug: string, rank: number | null) =>
  ({ slug, rank }) as unknown as DistroListItem;

test("compare slugs are canonical (alphabetical)", () => {
  expect(compareSlug("mint", "debian")).toBe("debian-vs-mint");
  expect(compareSlug("debian", "mint")).toBe("debian-vs-mint");
});

test("parses compare slugs even when keys contain dashes", () => {
  const known = new Set(["arch", "linux-lite", "vs-os", "mint"]);
  expect(parseCompareSlug("arch-vs-linux-lite", known)).toEqual(["arch", "linux-lite"]);
  expect(parseCompareSlug("mint-vs-vs-os", known)).toEqual(["mint", "vs-os"]);
  expect(parseCompareSlug("mint-vs-mint", known)).toBeNull();
  expect(parseCompareSlug("mint-vs-nope", known)).toBeNull();
});

test("popular pairs are all pairs among the top N, unranked excluded", () => {
  const items = [item("a", 1), item("b", 2), item("c", 3), item("z", null)];
  expect(popularPairs(items, 3)).toEqual([
    ["a", "b"],
    ["a", "c"],
    ["b", "c"],
  ]);
  expect(popularPairs(Array.from({ length: 20 }, (_, i) => item(`d${i}`, i + 1)), 10)).toHaveLength(45);
});
