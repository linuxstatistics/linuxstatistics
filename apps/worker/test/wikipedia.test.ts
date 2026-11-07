import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { addAlias, initPgliteDb, schema, upsertDistro, type Database } from "@linux-statistics/db";
import { lastFullMonth, pageviewsUrl, parsePageviews } from "../src/sources/wikipedia.js";
import { ingestWikipedia } from "../src/ingest-wikipedia.js";
import { runSources } from "../src/sources-run.js";
import type { FetchLike } from "../src/http.js";

let db: Database;
let client: PGlite;
beforeEach(async () => {
  ({ db, client } = await initPgliteDb());
});
afterEach(async () => {
  await client.close();
});

const NOW = new Date("2026-11-06T12:00:00Z");

/** Fake Wikimedia API: views per title per month, 404 for unknown titles. */
function wikimedia(perTitle: Record<string, number>): FetchLike {
  return async (url) => {
    const m = /per-article\/en\.wikipedia\/all-access\/user\/([^/]+)\/monthly\/(\d{6})0100\/(\d{6})\d{4}$/.exec(url);
    if (!m) return new Response("bad url", { status: 400 });
    const title = decodeURIComponent(m[1]!);
    if (!(title in perTitle)) return new Response("{}", { status: 404 });
    const items = [];
    for (let y = Number(m[2]!.slice(0, 4)), mo = Number(m[2]!.slice(4)); `${y}${String(mo).padStart(2, "0")}` <= m[3]!; mo === 12 ? (y++, (mo = 1)) : mo++) {
      items.push({ timestamp: `${y}${String(mo).padStart(2, "0")}0100`, views: perTitle[title] });
    }
    return Response.json({ items });
  };
}

test("URL, parser and month helpers", () => {
  expect(lastFullMonth(NOW)).toBe("2026-10");
  expect(lastFullMonth(new Date("2026-01-03T00:00:00Z"))).toBe("2025-12");
  expect(pageviewsUrl("Bazzite_(operating_system)", "2025-11", "2026-10")).toBe(
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/Bazzite_(operating_system)/monthly/2025110100/2026103100",
  );
  expect(parsePageviews({ items: [{ timestamp: "2026100100", views: 5 }] })).toEqual([{ month: "2026-10", views: 5 }]);
  expect(() => parsePageviews({ items: [{ timestamp: "x", views: 5 }] })).toThrow(/Malformed/);
  expect(() => parsePageviews({})).toThrow(/no items/);
});

test("fetches every linked article, applies hand pins, skips 404s and builds the index", async () => {
  const mint = await upsertDistro(db, { slug: "mint", name: "Mint", family: "debian", status: "active" });
  const fedora = await upsertDistro(db, { slug: "fedora", name: "Fedora", family: "rpm", status: "active" });
  const gone = await upsertDistro(db, { slug: "gone", name: "Gone", family: "other", status: "active" });
  await upsertDistro(db, { slug: "omarchy", name: "Omarchy", family: "arch", status: "active" }); // pinned title
  await addAlias(db, "enwiki", "Linux_Mint", mint);
  await addAlias(db, "enwiki", "Fedora_Linux", fedora);
  await addAlias(db, "enwiki", "Deleted_Article", gone);

  const r = await ingestWikipedia(db, { fetch: wikimedia({ Linux_Mint: 30000, Fedora_Linux: 40000, Omarchy: 1000 }), now: NOW });
  expect(r).toMatchObject({ articles: 4, written: 3, month: "2026-10", ranked: 3 });
  expect(r.failed).toEqual([{ slug: "gone", title: "Deleted_Article", error: "no views (404)" }]);
  const interest = (await db.select().from(schema.popularitySnapshots)).filter((s) => s.source === "interest" && s.period === "last-12-months");
  const bySlug = new Map((await db.select().from(schema.distros)).map((d) => [d.id, d.slug]));
  expect(interest.sort((a, b) => a.rank - b.rank).map((s) => bySlug.get(s.distroId))).toEqual(["fedora", "mint", "omarchy"]);
});

test("a rate limit stops the run; mostly-failed runs keep the last index", async () => {
  const mint = await upsertDistro(db, { slug: "mint", name: "Mint", family: "debian", status: "active" });
  await addAlias(db, "enwiki", "Linux_Mint", mint);
  const limited: FetchLike = async () => new Response("slow down", { status: 429 });
  await expect(ingestWikipedia(db, { fetch: limited, now: NOW })).rejects.toThrow(/429/);

  const status = await runSources(db, ["wikipedia"], { fetch: wikimedia({}), now: NOW, log: () => {} });
  expect(status.wikipedia).toBe("failed");
  expect((await db.select().from(schema.popularitySnapshots)).length).toBe(0);
});
