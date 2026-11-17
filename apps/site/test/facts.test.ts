import { expect, test } from "vitest";
import type { DistroDetail } from "@linux-statistics/shared";
import { factsText, keyFacts } from "../src/lib/facts";

const detail = (o: Partial<DistroDetail>) =>
  ({
    slug: "mint", name: "Linux Mint", family: "debian", status: "active", rank: 3, basedOnSlug: null, firstReleaseYear: null,
    releases: [], repoFullName: null, stars: null, homepage: null,
    userRating: { count: 0, average: null, mean: null, verifiedCount: 0 }, ...o,
  }) as unknown as DistroDetail;

test("unknown facts are left out; a bare distro still names its family", () => {
  expect(keyFacts(detail({ slug: "unchecked-xyz" })).map((f) => f.text)).toEqual(["Linux Mint belongs to the Debian family."]);
  expect(keyFacts(detail({ slug: "unchecked-xyz", family: "other" }))).toEqual([]);
});

test("a family's root distro is called its base, not a member", () => {
  expect(keyFacts(detail({ slug: "debian", name: "Debian" }))[0]?.text).toBe("Debian is the base of the Debian family of distributions.");
});

test("rank appears only when asked for and dated, and names our index", () => {
  const d = detail({});
  expect(keyFacts(d, { asOf: "2026-11-10" }).some((f) => /#3/.test(f.text))).toBe(false);
  const ranked = keyFacts(d, { asOf: "2026-11-10", includeRank: true })[0];
  expect(ranked?.text).toBe("Linux Mint ranked #3 on the LinuxStatistics composite index over the 12 months to November 2026.");
  expect(ranked?.text).not.toMatch(/distrowatch/i);
});

test("base, release, support, GitHub and ratings read as sentences", () => {
  const d = detail({
    basedOnSlug: "ubuntu", firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", stars: 5648,
    userRating: { count: 2, average: 4.25, mean: 4.5, verifiedCount: 2 },
    releases: [{ cycle: "22", codename: "Wilma", releasedOn: "2024-07-25", latest: "22.2", latestOn: "2025-09-04", supportEnds: null, eol: "2029-04-30", lts: true }],
  });
  const text = keyFacts(d, { baseName: "Ubuntu", today: "2026-11-16" }).map((f) => f.text);
  expect(text).toContain("Linux Mint is based on Ubuntu.");
  expect(text).toContain("Linux Mint was first released in 2006.");
  expect(text).toContain("The latest Linux Mint release is 22.2 LTS (Wilma, released Sep 2025).");
  expect(text).toContain("That release is supported until Apr 2029.");
  expect(text).toContain("Linux Mint's main GitHub repository (linuxmint/cinnamon) has 5,648 stars.");
  expect(text).toContain("LinuxStatistics users rate Linux Mint 4.3 out of 5 from 2 ratings.");
});

test("telemetry facts come from the checked list", () => {
  const mint = keyFacts(detail({ family: "other" }));
  expect(mint).toHaveLength(1);
  expect(mint[0]?.source).toMatch(/project's docs/);
});

test("llms-full block never carries a rank", () => {
  const block = factsText(detail({ homepage: "https://linuxmint.com/" }), "https://linuxstatistics.com", null);
  expect(block).toContain("## Linux Mint");
  expect(block).toContain("Page: https://linuxstatistics.com/distro/mint/");
  expect(block).not.toMatch(/#\d|rank/i);
});
