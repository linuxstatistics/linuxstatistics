import { expect, test } from "vitest";
import { badgeSnippets, badgeSvg, rankText } from "../src/lib/badge";
import { csvField, toCsv } from "../src/lib/csv";
import { DISTRO_COLUMNS, byName, distroRow, envelope, notesDataset } from "../src/lib/dataset";
import type { DistroListItem } from "@linux-statistics/shared";

test("badge SVG is self-contained, labelled and escapes text", () => {
  const svg = badgeSvg({ value: rankText(3), title: 'Mint & "friends"' });
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg).toContain('aria-label="Mint &amp; &quot;friends&quot;"');
  expect(svg).toContain(">#3</text>");
  expect(svg).not.toMatch(/<script|href=|https?:\/\/(?!www\.w3\.org)/);
  expect(badgeSvg({ value: rankText(null) })).toContain("not ranked");
  // wider value text gives a wider badge
  const w = (s: string) => Number(s.match(/width="(\d+)"/)![1]);
  expect(w(badgeSvg({ value: "#123" }))).toBeGreaterThan(w(badgeSvg({ value: "#1" })));
});

test("snippets link the badge to the distro page", () => {
  const s = badgeSnippets("https://linuxstatistics.com", "mint", "Mint");
  expect(s.markdown).toBe("[![Mint on LinuxStatistics](https://linuxstatistics.com/badge/mint.svg)](https://linuxstatistics.com/distro/mint/)");
  expect(s.html).toContain('href="https://linuxstatistics.com/distro/mint/"');
});

test("CSV quotes commas, quotes and newlines", () => {
  expect(csvField('a,b')).toBe('"a,b"');
  expect(csvField('say "hi"')).toBe('"say ""hi"""');
  expect(csvField(null)).toBe("");
  expect(csvField(["x", "y"])).toBe("x; y");
  expect(toCsv(["a", "b"], [[1, "x,y"]])).toBe('a,b\r\n1,"x,y"\r\n');
});

test("dataset rows match the column list and carry licence metadata", () => {
  const d = { slug: "mint", name: "Mint", family: "debian", status: "active", rank: 2, hitsPerDay: 1974, rank1m: 2, rank1mDelta: 0, rankTrend: 0,
    firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", stars: 5200, commitsLast30d: 180,
    userRating: { average: null, count: 0, mean: null, verifiedCount: 0 }, usesItCount: 0 } as DistroListItem;
  expect(distroRow(d)).toHaveLength(DISTRO_COLUMNS.length);
  expect(distroRow(d)[DISTRO_COLUMNS.indexOf("rating_average")]).toBeNull(); // no rating average without ratings
  expect(DISTRO_COLUMNS.some((c) => /rank|hits/.test(c))).toBe(false); // ranking-site data is never exported
  const e = envelope("2026-11-05", [], ["github"]);
  expect(e).toMatchObject({ version: "2.0.0", license: "CC-BY-4.0" });
  expect(e.sources[0]!.name).toBe("GitHub");
  const notes = notesDataset();
  expect(notes.find((n) => n.slug === "mint")?.telemetry?.level).toBe("none");
  expect(notes.every((n) => Array.isArray(n.pros))).toBe(true);
});

test("dataset lists distros by name, independent of rank", () => {
  const mk = (name: string, rank: number | null) => ({ name, slug: name.toLowerCase(), rank }) as DistroListItem;
  expect(byName([mk("Zed", 1), mk("B", null), mk("Abc", 3), mk("A", 2)]).map((d) => d.name)).toEqual(["A", "Abc", "B", "Zed"]);
});
