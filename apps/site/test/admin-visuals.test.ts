import { expect, test } from "vitest";
import type { DistroListItem } from "@linux-statistics/shared";
import { visualGaps } from "../src/lib/admin-visuals";
import { SCREENSHOTS } from "../src/lib/screenshots";

const item = (slug: string, rank: number | null) => ({ slug, name: slug.toUpperCase(), rank }) as unknown as DistroListItem;

test("monograms and missing screenshots come from the curated lists, by rank, within the top N", () => {
  const list = [item("no-such-distro-b", 3), item("mint", 1), item("no-such-distro-a", 2), item("unranked", null)];
  const v = visualGaps(list, 2);
  expect(v.monograms.map((d) => d.slug)).toEqual(["no-such-distro-a"]);
  expect(v.noScreenshot.map((d) => d.slug)).toEqual(["no-such-distro-a"]);
});

test("every stale screenshot is listed, unranked ones last", () => {
  const v = visualGaps([], 100);
  expect(v.stale.length).toBe(Object.values(SCREENSHOTS).filter((s) => s.stale).length);
  expect(v.stale.length).toBeGreaterThan(0);
});
