import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { addAlias, getDistroDetail, getDistroList, initPgliteDb, schema, upsertDistro, type Database } from "@linux-statistics/db";
import { DESKTOPS, PACKAGE_MANAGERS } from "@linux-statistics/shared";
import { parseWikidataFacts } from "../src/sources/wikidata-facts.js";
import { applyAllCuratedFacts, ingestFacts } from "../src/ingest-facts.js";
import { CURATED_FACTS } from "../src/distro-facts.js";
import { PROFILES } from "../../site/src/lib/picker-profiles.js";
import { runSources } from "../src/sources-run.js";

const here = dirname(fileURLToPath(import.meta.url));
// Synthetic SPARQL result in the real shape (invented items, real value items).
const json = JSON.parse(readFileSync(resolve(here, "fixtures/wikidata-facts-synthetic.json"), "utf8"));
const facts = () => parseWikidataFacts(json, { minItems: 1 });

let db: Database;
let client: PGlite;
beforeEach(async () => {
  ({ db, client } = await initPgliteDb());
});
afterEach(async () => {
  await client.close();
});

test("parser maps known desktops and package managers and drops the rest", () => {
  const all = facts();
  // Q100: GNOME + KDE kept, GTK dropped; APT kept, dpkg (low level) dropped.
  expect(all.find((x) => x.qid === "Q100")).toEqual({ qid: "Q100", desktops: ["gnome", "kde-plasma"], packageManager: "apt" });
  // Q103 only has the Almquist shell, which isn't a desktop: no record.
  expect(all.some((x) => x.qid === "Q103")).toBe(false);
  // Q104 names DNF and YUM: ambiguous, so no package manager.
  expect(all.find((x) => x.qid === "Q104")).toBeUndefined();
  // Q105: two Plasma versions become one desktop.
  expect(all.find((x) => x.qid === "Q105")).toEqual({ qid: "Q105", desktops: ["kde-plasma"], packageManager: "pacman" });
});

test("parser refuses a malformed or too-small result", () => {
  expect(() => parseWikidataFacts({})).toThrow(/bindings/);
  expect(() => parseWikidataFacts(json)).toThrow(/only \d+ distributions/);
});

test("every profiled distro has curated facts with known values and a source", () => {
  for (const p of PROFILES) expect(CURATED_FACTS[p.key], p.key).toBeDefined();
  for (const [slug, f] of Object.entries(CURATED_FACTS)) {
    if (f.default) expect(DESKTOPS, slug).toContain(f.default);
    for (const d of f.others ?? []) expect(DESKTOPS, slug).toContain(d);
    expect(f.others ?? [], `${slug} lists its default again`).not.toContain(f.default);
    if (f.pkg) expect(PACKAGE_MANAGERS, slug).toContain(f.pkg);
    expect(f.source, slug).toMatch(/^https?:\/\//);
    for (const e of f.editions ?? []) expect(CURATED_FACTS[e.slug], `${slug} edition ${e.slug}`).toBeDefined();
  }
});

test("curated facts win; Wikidata fills only empty fields and never the default desktop", async () => {
  const mint = await upsertDistro(db, { slug: "mint", name: "Linux Mint", family: "debian", status: "active" });
  await addAlias(db, "wikidata", "Q102", mint);
  const other = await upsertDistro(db, { slug: "somedistro", name: "Some Distro", family: "debian", status: "active" });
  await addAlias(db, "wikidata", "Q100", other);

  await applyAllCuratedFacts(db);
  const r = await ingestFacts(db, facts());
  expect(r.filled.sort()).toEqual(["Q100.otherDesktops", "Q100.packageManager"]);

  const m = (await getDistroDetail(db, "mint"))!;
  expect(m.facts).toMatchObject({ defaultDesktop: "cinnamon", otherDesktops: ["mate", "xfce"], packageManager: "apt", init: "systemd" });
  expect(m.facts!.fieldSources.otherDesktops).toBe("curated");
  const o = (await getDistroDetail(db, "somedistro"))!;
  expect(o.facts).toMatchObject({ defaultDesktop: null, otherDesktops: ["gnome", "kde-plasma"], packageManager: "apt", init: null });
  expect(o.facts!.fieldSources).toEqual({ otherDesktops: "wikidata", packageManager: "wikidata" });

  const list = await getDistroList(db);
  expect(list.find((d) => d.slug === "mint")).toMatchObject({ defaultDesktop: "cinnamon", otherDesktops: ["mate", "xfce"] });
  expect(list.find((d) => d.slug === "somedistro")).toMatchObject({ defaultDesktop: null });

  // Idempotent.
  await applyAllCuratedFacts(db);
  expect((await ingestFacts(db, facts())).filled).toEqual([]);
  expect((await db.select().from(schema.distroFacts)).length).toBe(2);
});

test("a distro without facts reports none", async () => {
  await upsertDistro(db, { slug: "nofacts", name: "No Facts", family: "other", status: "active" });
  const d = (await getDistroDetail(db, "nofacts"))!;
  expect(d.facts).toBeNull();
  expect(d.defaultDesktop).toBeNull();
  expect(d.otherDesktops).toEqual([]);
});

test("a failed facts query fails the run but keeps the distro matches and earlier facts", async () => {
  const id = await upsertDistro(db, { slug: "mint", name: "Linux Mint", family: "debian", status: "active" });
  await applyAllCuratedFacts(db);
  const main = { results: { bindings: Array.from({ length: 200 }, (_, i) => ({ item: { value: `http://www.wikidata.org/entity/Q${9000 + i}` }, itemLabel: { value: `Distro ${i}` } })) } };
  const fetch = async (url: string | URL | Request) =>
    String(url).includes(encodeURIComponent("P1414")) ? new Response("bad query", { status: 400 }) : Response.json(main);
  const status = await runSources(db, ["wikidata"], { fetch: fetch as typeof globalThis.fetch, log: () => {} });
  expect(status.wikidata).toBe("failed");
  expect((await db.select().from(schema.distroFacts)).find((r) => r.distroId === id)?.defaultDesktop).toBe("cinnamon");
}, 30_000);
