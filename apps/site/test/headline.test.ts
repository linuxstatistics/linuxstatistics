import { expect, test } from "vitest";
import type { DistroListItem } from "@linux-statistics/shared";
import { buildHeadline, joinNames, topRanked } from "../src/lib/headline";

const d = (name: string, rank: number | null, rank1m: number | null) =>
  ({ name, rank, rank1m, rank1mDelta: rank != null && rank1m != null ? rank - rank1m : null }) as DistroListItem;

test("names #1 and the biggest top-20 climber, in words", () => {
  const h = buildHeadline([d("Mint", 2, 2), d("CachyOS", 1, 1), d("Omarchy", 16, 7), d("Fedora", 7, 4), d("Far", 90, 30)]);
  expect(h).toEqual({ leader: "CachyOS", mover: { name: "Omarchy", text: "jumps nine places." } });
});

test("falls back to the top 100 when nobody in the top 20 climbed", () => {
  const h = buildHeadline([d("CachyOS", 1, 1), d("Mint", 2, 3), d("Far", 61, 28)]);
  expect(h?.mover).toEqual({ name: "Far", text: "jumps 33 places." });
});

test("singular place, no mover, and empty data", () => {
  expect(buildHeadline([d("A", 1, 1), d("B", 3, 2)])?.mover?.text).toBe("jumps one place.");
  expect(buildHeadline([d("A", 1, 1), d("B", 2, 2)])?.mover).toBeNull();
  expect(buildHeadline([d("A", null, null)])).toBeNull();
});

test("topRanked skips unranked distros and returns rank order", () => {
  expect(topRanked([d("B", 2, 2), d("X", null, null), d("A", 1, 1), d("C", 3, 3)], 2).map((x) => x.name)).toEqual(["A", "B"]);
});

test("joinNames writes a plain English list", () => {
  expect(joinNames(["Arch", "Mint", "Zorin OS"])).toBe("Arch, Mint and Zorin OS");
  expect(joinNames(["Arch"])).toBe("Arch");
  expect(joinNames([])).toBe("");
});
