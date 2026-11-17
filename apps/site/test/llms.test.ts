import { expect, test } from "vitest";
import type { DistroDetail } from "@linux-statistics/shared";
import { datasetJsonLd, llmsFull, llmsIndex } from "../src/lib/llms";

const SITE = "https://linuxstatistics.com";
const d = (slug: string, name: string, o: Partial<DistroDetail> = {}) =>
  ({
    slug, name, family: "debian", status: "active", rank: 1, hitsPerDay: 9000, basedOnSlug: null, firstReleaseYear: 2006,
    releases: [], repoFullName: null, stars: null, homepage: null,
    userRating: { count: 0, average: null, mean: null, verifiedCount: 0 }, ...o,
  }) as unknown as DistroDetail;

test("llms.txt has a title, summary, absolute links and the interest caveat", () => {
  const txt = llmsIndex(SITE, 545);
  expect(txt.startsWith("# LinuxStatistics\n\n> ")).toBe(true);
  expect(txt).toContain("545 Linux distributions");
  expect(txt).toContain(`(${SITE}/llms-full.txt)`);
  expect(txt).toMatch(/not installs/);
  for (const m of txt.matchAll(/\]\(([^)]+)\)/g)) expect(m[1]).toMatch(/^https:\/\/linuxstatistics\.com\//);
});

test("llms-full.txt lists every distro by name, resolves bases and carries no rank data", () => {
  const txt = llmsFull(SITE, "2026-11-16", [d("ubuntu", "Ubuntu"), d("mint", "Linux Mint", { basedOnSlug: "ubuntu", rank: 3 })]);
  expect(txt.indexOf("## Linux Mint")).toBeLessThan(txt.indexOf("## Ubuntu"));
  expect(txt).toContain("Linux Mint is based on Ubuntu.");
  expect(txt).toContain("CC-BY-4.0");
  expect(txt).not.toMatch(/#\d|ranked|hits|9000|9,000/i);
});

test("Dataset JSON-LD names the licence and every download", () => {
  const ld = datasetJsonLd(SITE, 545, "2026-11-16");
  expect(ld["@type"]).toBe("Dataset");
  expect(ld.license).toBe("https://creativecommons.org/licenses/by/4.0/");
  expect(ld.distribution.map((x) => x.contentUrl)).toEqual([
    `${SITE}/data/distros.json`, `${SITE}/data/distros.csv`, `${SITE}/data/notes.json`, `${SITE}/data/market-share.csv`,
  ]);
});
