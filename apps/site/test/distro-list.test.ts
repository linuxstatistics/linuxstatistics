import { afterEach, expect, test, vi } from "vitest";
import type { DistroListItem } from "@linux-statistics/shared";
import { LIST_FIELDS, loadDistroList, packList, resetDistroList, topSearchItems, unpackList } from "../src/lib/distro-list";

afterEach(() => {
  resetDistroList();
  vi.unstubAllGlobals();
});

const full: DistroListItem = {
  slug: "mint", name: "Linux Mint", family: "debian", status: "active", rank: 2, hitsPerDay: 2600, stars: 5200,
  commitsLast30d: 180, firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", rankTrend: 2, rank1m: 1, rank1mDelta: 1,
  userRating: { average: 4.61234, count: 10, mean: 4.6, verifiedCount: 9 }, usesItCount: 22, defaultDesktop: "cinnamon", otherDesktops: ["mate", "xfce"],
};

test("packing keeps every field the islands use and drops the rest", () => {
  const [row] = unpackList(JSON.parse(JSON.stringify(packList([full]))));
  expect(row).toEqual({
    slug: "mint", name: "Linux Mint", family: "debian", status: "active", rank: 2, hitsPerDay: 2600, stars: 5200,
    commitsLast30d: 180, firstReleaseYear: 2006, rankTrend: 2, rank1m: 1, rank1mDelta: 1,
    userRating: { average: 4.612, count: 10 },
  });
});

test("packed rows are much smaller than the list objects", () => {
  const many = Array.from({ length: 200 }, (_, i) => ({ ...full, slug: `d${i}`, name: `Distro ${i}` }));
  expect(JSON.stringify(packList(many)).length).toBeLessThan(JSON.stringify(many).length * 0.4);
});

test("a list with other fields is refused, not misread", () => {
  expect(() => unpackList({ fields: ["name", "slug"], rows: [] })).toThrow(/unexpected fields/);
  expect(LIST_FIELDS.slice(0, 2)).toEqual(["slug", "name"]);
});

test("top search items are the best-ranked, in rank order, unranked left out", () => {
  const items = [{ slug: "a", name: "A", rank: 3 }, { slug: "b", name: "B", rank: null }, { slug: "c", name: "C", rank: 1 }];
  expect(topSearchItems(items, 5).map((d) => d.slug)).toEqual(["c", "a"]);
});

test("the list is fetched once per page, and again after a failure", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response("nope", { status: 500 }))
    .mockResolvedValue(new Response(JSON.stringify(packList([full]))));
  vi.stubGlobal("fetch", fetchMock);
  await expect(loadDistroList("/lists/distros.json")).rejects.toThrow("500");
  const [a, b] = await Promise.all([loadDistroList("/lists/distros.json"), loadDistroList("/lists/distros.json")]);
  expect(a).toBe(b);
  expect(a[0]!.slug).toBe("mint");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
