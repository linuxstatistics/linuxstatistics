import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { addAlias, getDistroDetail, getDistroList, initPgliteDb, schema, upsertDistro, type Database } from "@linux-statistics/db";
import { parseWikidataDistros, slugify } from "../src/sources/wikidata.js";
import { ingestWikidataDistros } from "../src/ingest-wikidata.js";
import { runSources } from "../src/sources-run.js";

const here = dirname(fileURLToPath(import.meta.url));
// Synthetic SPARQL result in the real shape (invented items).
const json = JSON.parse(readFileSync(resolve(here, "fixtures/wikidata-synthetic.json"), "utf8"));
const items = () => parseWikidataDistros(json, { minItems: 1 });

let db: Database;
let client: PGlite;
beforeEach(async () => {
  ({ db, client } = await initPgliteDb());
});
afterEach(async () => {
  await client.close();
});

test("parser merges rows per item, keeps every DistroWatch ID and skips unlabelled items", () => {
  const all = items();
  const mint = all.find((x) => x.qid === "Q102")!;
  expect(mint).toEqual({
    qid: "Q102", name: "Linux Mint", distrowatchKeys: ["mint"], baseQids: ["Q101"],
    firstReleaseYear: 2006, homepage: "https://linuxmint.com", dissolved: false, enwikiTitle: "Linux_Mint",
  });
  expect(all.some((x) => x.qid === "Q106")).toBe(false);
  expect(all.find((x) => x.qid === "Q107")!.distrowatchKeys).toEqual(["twokeys-a", "twokeys-b"]);
  expect(all.find((x) => x.qid === "Q105")!.dissolved).toBe(true);
});

test("parser refuses a malformed or too-small result", () => {
  expect(() => parseWikidataDistros({})).toThrow(/bindings/);
  expect(() => parseWikidataDistros(json)).toThrow(/only \d+ distributions/);
});

test("slugify makes URL-safe slugs", () => {
  expect(slugify("Pop!_OS")).toBe("pop-os");
  expect(slugify("Emmabuntüs")).toBe("emmabuntus");
});

test("matches by alias and slug, fills only blanks, discovers new distros unlisted, skips dissolved", async () => {
  // Our slug differs from DistroWatch's key; matched through the alias.
  const mint = await upsertDistro(db, { slug: "linux-mint", name: "Mint", family: "debian", status: "active" });
  await addAlias(db, "distrowatch", "mint", mint);
  // Matched by slug; curated values are kept.
  await upsertDistro(db, { slug: "ubuntu", name: "Ubuntu", family: "debian", status: "active", homepage: "https://ubuntu.com/desktop", firstReleaseYear: 2004 });
  await upsertDistro(db, { slug: "debian", name: "Debian", family: "debian", status: "active" });

  const r = await ingestWikidataDistros(db, items());
  expect(r.matched).toBe(3);
  // Q108 is also named "Debian", but Q100 claims our debian first, so Q108 gets its own unlisted slug.
  expect(r.discovered.sort()).toEqual(["debian-q108", "fedora-linux", "brand-new-os", "two-keys"].sort());
  expect(r.discovered).not.toContain("old-gone-linux");

  const detail = (slug: string) => db.select().from(schema.distros).then((x) => x.find((d) => d.slug === slug)!);
  expect(await detail("linux-mint")).toMatchObject({ basedOnSlug: "ubuntu", homepage: "https://linuxmint.com", firstReleaseYear: 2006, discoveredVia: null });
  const mintAliases = (await db.select().from(schema.distroAliases)).filter((x) => x.distroId === mint).map((x) => `${x.source}:${x.alias}`);
  expect(mintAliases.sort()).toEqual(["distrowatch:mint", "enwiki:Linux_Mint", "wikidata:Q102"]);
  // Curated distro: its homepage is kept and its base is never taken from Wikidata.
  expect(await detail("ubuntu")).toMatchObject({ homepage: "https://ubuntu.com/desktop", basedOnSlug: null });
  expect(await detail("brand-new-os")).toMatchObject({ family: "other", discoveredVia: "wikidata", basedOnSlug: "debian", firstReleaseYear: 2025 });

  // Discovered distros stay off the public list and have no page.
  const slugs = (await getDistroList(db)).map((d) => d.slug);
  expect(slugs.sort()).toEqual(["debian", "linux-mint", "ubuntu"]);

  // Second run: nothing new, nothing refilled.
  const again = await ingestWikidataDistros(db, items());
  expect(again.discovered).toEqual([]);
  expect(again.filled).toEqual([]);
  expect(again.matched).toBe(items().filter((x) => !x.dissolved).length);
});

test("a discovered distro appears once it has a signal", async () => {
  await ingestWikidataDistros(db, items());
  expect((await getDistroList(db)).some((d) => d.slug === "brand-new-os")).toBe(false);
  const row = (await db.select().from(schema.distros)).find((d) => d.slug === "brand-new-os");
  await db.insert(schema.githubRepos).values({ distroId: row!.id, repoFullName: "brand/new", stars: 5 });
  expect((await getDistroList(db)).some((d) => d.slug === "brand-new-os")).toBe(true);
  expect(await getDistroDetail(db, "brand-new-os")).not.toBeNull();
});

test("a bad Wikidata response is recorded as failed and changes nothing", async () => {
  await upsertDistro(db, { slug: "debian", name: "Debian", family: "debian", status: "active" });
  const status = await runSources(db, ["wikidata"], { fetch: async () => Response.json({ results: { bindings: [] } }), log: () => {} });
  expect(status.wikidata).toBe("failed");
  expect((await db.select().from(schema.distros)).length).toBe(1);
});

test("a same-named item never takes a distro that already has a DistroWatch ID; an old ID still matches", async () => {
  const ours = await upsertDistro(db, { slug: "debian", name: "Debian", family: "debian", status: "active" });
  await addAlias(db, "distrowatch", "debian-real", ours);
  const two = await upsertDistro(db, { slug: "twokeys", name: "Two Keys", family: "other", status: "active" });
  await addAlias(db, "distrowatch", "twokeys-b", two);
  const r = await ingestWikidataDistros(db, items());
  // Q100 and Q108 are both named "Debian" but neither carries our DistroWatch ID.
  expect(r.discovered).toEqual(expect.arrayContaining(["debian-q100", "debian-q108"]));
  // Q107 lists two DistroWatch IDs; the second one is ours.
  expect(r.discovered).not.toContain("two-keys");
});

test("a reused DistroWatch ID is not trusted alone: different name and homepage drop the match", async () => {
  // Our "brandnew" is unrelated to Wikidata's "Brand New OS" but shares the DistroWatch ID.
  const ours = await upsertDistro(db, { slug: "other-thing", name: "Other Thing", family: "rpm", status: "active", homepage: "https://other.example" });
  await addAlias(db, "distrowatch", "twokeys-a", ours);
  const r = await ingestWikidataDistros(db, items());
  expect(r.rejected.some((x) => x.startsWith("other-thing <- Two Keys (Q107)"))).toBe(true);
  // Nothing filled on ours, and no discovered duplicate for the rejected item.
  const row = (await db.select().from(schema.distros)).find((d) => d.slug === "other-thing")!;
  expect(row.homepage).toBe("https://other.example");
  expect(r.discovered).not.toContain("two-keys");
});

test("matchProblem: homepage domain wins; same name needs no contradiction", async () => {
  const { matchProblem, sameName } = await import("../src/ingest-wikidata.js");
  const it = { qid: "Q1", name: "Aurora", distrowatchKeys: ["aurora"], baseQids: [], firstReleaseYear: 2009, homepage: "http://www.eeebuntu.org/", dissolved: false, enwikiTitle: null };
  const fedora = { slug: "fedora", family: "rpm" };
  const ubuntu = { slug: "ubuntu", family: "debian" };
  expect(matchProblem("Aurora", "https://getaurora.dev", fedora, it, ubuntu)).toMatch(/homepage differs/);
  expect(matchProblem("Aurora", null, fedora, it, ubuntu)).toMatch(/base differs/);
  // Same lineage (Debian vs Ubuntu) is not a contradiction.
  expect(matchProblem("Aurora", null, { slug: "debian", family: "debian" }, it, ubuntu)).toBeNull();
  expect(matchProblem("Something", "https://eeebuntu.org", null, it, null)).toBeNull();
  expect(sameName("Mint", "Linux Mint")).toBe(true);
  expect(sameName("Pop!_OS", "Pop OS")).toBe(true);
  expect(sameName("Commodore", "Commodore OS")).toBe(true);
  expect(sameName("Kodachi", "Linux Kodachi")).toBe(true);
  expect(sameName("AV Linux", "AVLinux")).toBe(true);
  expect(sameName("Crunchbangplusplus", "CrunchBang Plus Plus")).toBe(true);
  expect(sameName("Aurora", "Eeebuntu")).toBe(false);
  expect(sameName("RasPiOS", "Raspberry Pi OS")).toBe(false);
});

test("a pinned Wikidata item matches our distro even when the names differ", async () => {
  const { WIKIDATA_PINS } = await import("../src/families.js");
  const [slug, qid] = Object.entries(WIKIDATA_PINS)[0]!;
  await upsertDistro(db, { slug, name: "Totally Different", family: "debian", status: "active" });
  const pinned = { qid, name: "Raspberry Pi OS", distrowatchKeys: [], baseQids: [], firstReleaseYear: 2012, homepage: "https://www.raspberrypi.com/software/", dissolved: false, enwikiTitle: null };
  const r = await ingestWikidataDistros(db, [pinned]);
  expect(r.matched).toBe(1);
  expect(r.discovered).toEqual([]);
  const row = (await db.select().from(schema.distros)).find((d) => d.slug === slug)!;
  expect(row.firstReleaseYear).toBe(2012);
});
