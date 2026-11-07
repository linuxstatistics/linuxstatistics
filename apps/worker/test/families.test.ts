import { expect, test } from "vitest";
import { CHECKED_AGAINST_WIKIDATA, CURATED, WIKIDATA_PINS } from "../src/families.js";

test("curated bases point at curated distros", () => {
  for (const [slug, c] of Object.entries(CURATED)) {
    if (c.basedOn) expect(CURATED[c.basedOn], `${slug}.basedOn = ${c.basedOn}`).toBeDefined();
  }
});

test("hand-checked Wikidata notes and pins refer to curated distros and real fields", () => {
  for (const key of Object.keys(CHECKED_AGAINST_WIKIDATA)) {
    const [slug, field] = key.split(".");
    expect(CURATED[slug!], key).toBeDefined();
    expect(["basedOn", "firstReleaseYear", "homepage"]).toContain(field);
  }
  for (const [slug, qid] of Object.entries(WIKIDATA_PINS)) {
    expect(slug).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    expect(qid).toMatch(/^Q\d+$/);
  }
  expect(new Set(Object.values(WIKIDATA_PINS)).size).toBe(Object.keys(WIKIDATA_PINS).length);
});
