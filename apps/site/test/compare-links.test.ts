import { expect, test } from "vitest";
import { firstSentence, nextSteps } from "../src/lib/compare-links";

const base = { slug: "openmamba", name: "openmamba", family: "independent" as const, basedOnSlug: null, firstReleaseYear: 2004, homepage: "https://openmamba.org/", repoFullName: null, description: { text: "openmamba is an Italian Linux distribution. It is developed by a small team.\n\nMore.", title: "Openmamba", revisionId: 1, fetchedAt: "2026-11-01" } };

test("next steps for an unprofiled distro carry a one-sentence summary and links, not table facts", () => {
  const s = nextSteps(base);
  expect(s).toMatchObject({ href: "/distro/openmamba/", summary: "openmamba is an Italian Linux distribution.", website: "https://openmamba.org/", slug: "openmamba" });
  expect(s.guide).toBeUndefined();
  expect(JSON.stringify(s)).not.toMatch(/2004|Independent|family/i);
  expect(nextSteps({ ...base, slug: "mint" }).guide).toBe("/switch/getting-started/?distro=mint");
});

test("firstSentence trims long text", () => {
  expect(firstSentence("x".repeat(400)).length).toBeLessThanOrEqual(220);
});
