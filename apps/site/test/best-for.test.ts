import { expect, test } from "vitest";
import { BEST_TOPICS, MAX_PICKS, MIN_PICKS, bestPicks, isIndexable } from "../src/lib/best-for";
import { rankAll } from "../src/lib/picker";
import { PROFILES } from "../src/lib/picker-profiles";
import { NOINDEX_PATHS } from "../src/config/noindex.js";

const rankOf = () => null;

test("topic slugs are unique and related links point at real topics", () => {
  const slugs = BEST_TOPICS.map((t) => t.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const t of BEST_TOPICS) for (const r of t.related) expect(slugs, `${t.slug} -> ${r}`).toContain(r);
});

test("topic pages and the quiz agree: picks keep the quiz engine's order", () => {
  for (const t of BEST_TOPICS) {
    const quizOrder = rankAll(t.answers, PROFILES, rankOf).map((s) => s.key);
    const picks = bestPicks(t, PROFILES, rankOf).map((p) => p.key);
    expect(picks.length, t.slug).toBeLessThanOrEqual(MAX_PICKS);
    expect(picks, t.slug).toEqual(quizOrder.filter((k) => picks.includes(k)));
  }
});

test("every pick really carries the topic's tag", () => {
  const byKey = new Map(PROFILES.map((p) => [p.key, p]));
  for (const t of BEST_TOPICS) for (const p of bestPicks(t, PROFILES, rankOf)) expect(t.qualifies(byKey.get(p.key)!), `${t.slug}: ${p.key}`).toBe(true);
});

test("thin topics are listed as noindex, and only those (run best:noindex to update)", () => {
  const thin = BEST_TOPICS.filter((t) => !isIndexable(bestPicks(t, PROFILES, rankOf))).map((t) => `/best/${t.slug}/`);
  expect([...NOINDEX_PATHS].sort()).toEqual(thin.sort());
});

test("tag sources are https links", () => {
  for (const p of PROFILES) {
    if (p.laptop) expect(p.laptop.source, p.key).toMatch(/^https:\/\//);
    for (const src of Object.values(p.useSources ?? {})) expect(src, p.key).toMatch(/^https:\/\//);
  }
  expect(MIN_PICKS).toBe(5);
});
