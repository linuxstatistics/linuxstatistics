import { expect, test } from "vitest";
import type { DistroListItem } from "@linux-statistics/shared";
import { compareHref, compareSuggestions, neighbours, sameFamily } from "../src/lib/related";

const d = (slug: string, rank: number | null, family: DistroListItem["family"] = "debian") =>
  ({ slug, name: slug.toUpperCase(), rank, family }) as DistroListItem;

const items = [d("a", 1, "arch"), d("b", 2), d("c", 3), d("d", 4, "rpm"), d("e", 5), d("f", null)];

test("neighbours are the ranks around a distro, excluding itself", () => {
  expect(neighbours(items, "c").map((x) => x.slug)).toEqual(["a", "b", "d", "e"]);
  expect(neighbours(items, "a", 1).map((x) => x.slug)).toEqual(["b"]);
  expect(neighbours(items, "f")).toEqual([]);
});

test("same family puts derivatives first, then by rank, ranked only", () => {
  const basedOn = new Map<string, string | null>([["e", "b"]]);
  expect(sameFamily(items, { slug: "b", family: "debian" }, basedOn).map((x) => x.slug)).toEqual(["e", "c"]);
  expect(sameFamily(items, { slug: "b", family: "other" }, basedOn)).toEqual([]);
});

test("compare links use the static page when prerendered", () => {
  const pairs = new Set(["a-vs-b"]);
  expect(compareHref("b", "a", pairs)).toBe("/compare/a-vs-b/");
  expect(compareHref("b", "e", pairs)).toBe("/compare/?a=b&b=e");
});

test("suggestions start with the base, then prerendered pairs", () => {
  const pairs = new Set(["a-vs-c"]);
  const s = compareSuggestions(items, { slug: "c", name: "C", basedOnSlug: "e" }, pairs, 3);
  expect(s.map((x) => x.label)).toEqual(["C vs E", "C vs A", "C vs B"]);
  expect(s[1]!.href).toBe("/compare/a-vs-c/");
});
