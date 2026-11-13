import { expect, test } from "vitest";
import { moversItem, releaseItems, renderAtom } from "../src/lib/feed";

const site = new URL("https://linuxstatistics.com");
const now = new Date("2026-11-13T00:00:00Z");
const mint = {
  slug: "mint",
  name: "Mint",
  releases: [
    { cycle: "22.3", codename: "Zena", releasedOn: "2026-01-11", latest: null, latestOn: null, supportEnds: "2029-04-30", eol: "2029-04-30", lts: true },
    { cycle: "21", codename: "Vanessa", releasedOn: "2022-07-31", latest: "21.3", latestOn: "2024-01-12", supportEnds: "2027-04-30", eol: null, lts: true },
  ],
};

test("release items are dated, credited and limited to recent ones by default", () => {
  const items = releaseItems(mint, site, now);
  expect(items.map((i) => i.title)).toEqual(["Mint 22.3 (Zena) released (long-term support)"]);
  expect(items[0]!.summary).toContain("endoflife.date (CC BY-SA 4.0)");
  expect(items[0]!.link).toBe("https://linuxstatistics.com/distro/mint/");
});

test("a longer window includes point updates, newest first", () => {
  const titles = releaseItems(mint, site, now, 3650).map((i) => i.title);
  expect(titles).toEqual(["Mint 22.3 (Zena) released (long-term support)", "Mint 21.3 update", "Mint 21 (Vanessa) released (long-term support)"]);
});

test("feeds carry no rank numbers or scores", () => {
  const xml = renderAtom({ title: "t", subtitle: "s", self: "https://linuxstatistics.com/feed.xml", home: "https://linuxstatistics.com/", items: [...releaseItems(mint, site, now), moversItem("2026-11-08T22:00:00Z", site)] });
  expect(xml).not.toMatch(/#\d|\brank(ed)?\b|interest score|hits/i);
  expect(xml).toContain("<title>Rising and falling distros: November 2026</title>");
  expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
});

test("text is escaped", () => {
  const xml = renderAtom({ title: "A & B <c>", subtitle: "", self: "https://x/feed.xml", home: "https://x/", items: [] });
  expect(xml).toContain("A &amp; B &lt;c&gt;");
});
