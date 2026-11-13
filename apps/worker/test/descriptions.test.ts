import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { addAlias, getDistroDetail, initPgliteDb, upsertDistro } from "@linux-statistics/db";
import { descriptionUrl, parseDescription } from "../src/sources/descriptions.js";
import { ingestDescriptions } from "../src/ingest-descriptions.js";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/wikipedia-description.json", import.meta.url), "utf8"));

test("description parser keeps source revision and plain-text introduction", () => {
  expect(parseDescription(fixture)).toMatchObject({ title: "Example Linux", revisionId: 456 });
  expect(() => parseDescription(fixture, "Q999")).toThrow(/identity/);
  expect(new URL(descriptionUrl("Example Linux")).searchParams.get("titles")).toBe("Example Linux");
  for (const page of [{ ns: 0, title: "x", extract: "short" }, { ...fixture.query.pages[123], pageprops: { disambiguation: "" } }, { ...fixture.query.pages[123], extract: "<script>bad</script>" }]) {
    expect(() => parseDescription({ query: { pages: { 123: page } } })).toThrow();
  }
});

test("ingestion caches descriptions, is idempotent, and keeps good text after failure", async () => {
  const { db, client } = await initPgliteDb();
  try {
    const id = await upsertDistro(db, { slug: "example", name: "Example Linux", family: "independent", status: "active" });
    await addAlias(db, "enwiki", "Example Linux", id);
    await addAlias(db, "enwiki", "Z Example redirect", id);
    await addAlias(db, "wikidata", "Q123", id);
    const now = new Date("2026-11-13T12:00:00Z");
    const requests: string[] = [];
    const fetch = async (url: string) => { requests.push(url); return Response.json(fixture); };
    expect(await ingestDescriptions(db, { fetch, now })).toBe(1);
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0]!).searchParams.get("titles")).toBe("Example Linux");
    expect(await ingestDescriptions(db, { fetch, now })).toBe(1);
    const cached = (await getDistroDetail(db, "example"))?.description;
    expect(cached).toMatchObject({ title: "Example Linux", revisionId: 456, fetchedAt: now.toISOString() });
    await expect(ingestDescriptions(db, { fetch: async () => new Response("", { status: 404 }) })).rejects.toThrow();
    expect((await getDistroDetail(db, "example"))?.description).toEqual(cached);
    await expect(ingestDescriptions(db, { fetch: async () => Response.json({ query: { pages: { 123: { ...fixture.query.pages[123], pageprops: { wikibase_item: "Q999" } } } } }) })).rejects.toThrow();
    expect((await getDistroDetail(db, "example"))?.description).toEqual(cached);
  } finally { await client.close(); }
});
