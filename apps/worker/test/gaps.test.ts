import { expect, test } from "vitest";
import type { DistroListItem } from "@linux-statistics/shared";
import { buildReport, collectReport, endoflifeProposals, githubProposals, missingFor, reportMarkdown } from "../src/gaps.js";
import type { FetchLike } from "../src/http.js";
import type { WikidataDistro } from "../src/sources/wikidata.js";

const item = (slug: string, name: string, rank: number, extra: Partial<DistroListItem> = {}): DistroListItem =>
  ({ slug, name, rank, family: "other", firstReleaseYear: null, repoFullName: null, ...extra }) as DistroListItem;

test("a curated distro with everything is missing nothing; an unknown one is missing all of it", () => {
  const mint = item("mint", "Linux Mint", 1, { firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon" });
  expect(missingFor(mint, { slug: "mint", homepage: "https://linuxmint.com", description: null, releases: [{}] as never, repoFullName: null, firstReleaseYear: 2006 })).toEqual([]);
  expect(missingFor(item("zzz", "Zzz", 300), undefined)).toEqual(["profile", "notes", "telemetry", "summary", "releaseYear", "homepage", "repo", "releases"]);
});

test("endoflife proposals: same-name OS products we don't map yet, nothing else", () => {
  const ranked = [item("clearlinux", "Clear Linux", 40), item("mint", "Linux Mint", 1)];
  const products = [
    { name: "clear-linux", label: "Clear Linux", category: "os" },
    { name: "linuxmint", label: "Linux Mint", category: "os" },
    { name: "python", label: "Python", category: "lang" },
  ];
  expect(endoflifeProposals(products, ranked)).toEqual([{ slug: "clearlinux", kind: "endoflife", value: "clear-linux", why: expect.stringContaining("Clear Linux") }]);
});

test("GitHub proposals tie Wikidata items by Wikipedia title or a unique homepage domain, and skip curated repos", () => {
  const wd = (qid: string, name: string, enwikiTitle: string | null, homepage: string | null, githubRepos: string[]): WikidataDistro =>
    ({ qid, name, distrowatchKeys: [], baseQids: [], firstReleaseYear: null, homepage, dissolved: false, enwikiTitle, githubRepos });
  const items = [wd("Q1", "Pentoo", "Pentoo", "https://pentoo.org", ["pentoo/pentoo-overlay"]), wd("Q2", "Gargoyle", null, "https://gargoyle.example", ["ericpaulbishop"]), wd("Q3", "Mint", "Linux_Mint", null, ["linuxmint"])];
  const ranked = [item("pentoo", "Pentoo", 90), item("gargoyle", "Gargoyle", 120), item("mint", "Linux Mint", 1), item("lonely", "Lonely", 130)];
  const details = new Map([
    ["pentoo", { slug: "pentoo", homepage: null, description: { title: "Pentoo", text: "", revisionId: 1, fetchedAt: "" }, releases: [], repoFullName: null, firstReleaseYear: null }],
    ["gargoyle", { slug: "gargoyle", homepage: "https://www.gargoyle.example/", description: null, releases: [], repoFullName: null, firstReleaseYear: null }],
  ]);
  const p = githubProposals(items, ranked, details);
  expect(p.map((x) => `${x.slug}=${x.value}`)).toEqual(["pentoo=pentoo/pentoo-overlay", "gargoyle=ericpaulbishop"]);
  expect(p[1]!.why).toMatch(/org/);
});

test("the report lists gaps by rank, flags distros with no editorial data, and renders markdown", () => {
  const r = buildReport([item("mint", "Linux Mint", 1), item("newos", "New OS", 12)], new Map(), [], new Date("2026-11-15T00:00:00Z"));
  expect(r.rows.map((x) => x.slug)).toEqual(["mint", "newos"]);
  expect(r.newUnprofiled).toEqual(["newos"]);
  const md = reportMarkdown(r);
  expect(md).toContain("#12 New OS (`newos`): quiz profile or reference card, pros and cons, telemetry check");
  expect(md).not.toMatch(/Proposals/);
});

test("collectReport reads the API and keeps going when a free source fails", async () => {
  const fake: FetchLike = async (url) => {
    if (url.endsWith("/api/distros")) return Response.json([item("newos", "New OS", 3), { ...item("unranked", "Unranked", 0), rank: null }]);
    if (url.includes("/api/distros/newos")) return Response.json({ slug: "newos", homepage: null, description: null, releases: [], repoFullName: null, firstReleaseYear: null });
    if (url.includes("endoflife.date")) return Response.json({ result: [{ name: "newos", label: "New OS", category: "os" }] });
    return new Response("down", { status: 404 });
  };
  const logs: string[] = [];
  const r = await collectReport({ api: "http://api.test", fetch: fake, log: (m) => logs.push(m) });
  expect(r.considered).toBe(1);
  expect(r.proposals).toEqual([expect.objectContaining({ slug: "newos", kind: "endoflife", value: "newos" })]);
  expect(logs.join(" ")).toMatch(/Wikidata skipped/);
});

test("curated repos are unique per distro and look like owner/name", async () => {
  const { GITHUB_REPOS } = await import("../src/github-repos.js");
  expect(new Set(GITHUB_REPOS.map((r) => r.key)).size).toBe(GITHUB_REPOS.length);
  for (const r of GITHUB_REPOS) expect(r.repo, r.key).toMatch(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/);
});
