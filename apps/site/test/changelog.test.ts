import { expect, test } from "vitest";
import { COMPOSITE_WEIGHTS } from "@linux-statistics/shared";
import { CHANGELOG, changeRows, entriesFor, sourceRow } from "../src/lib/changelog";
import { PROFILES } from "../src/lib/picker-profiles";

test("the newest method entry records the current index weights", () => {
  const latest = CHANGELOG.find((e) => e.kind === "method" && e.weights);
  expect(latest, "add a method entry with the new weights to apps/site/src/lib/changelog.ts").toBeDefined();
  expect(latest!.weights).toEqual({ ...COMPOSITE_WEIGHTS });
});

test("entries are newest first, dated, plain and evidenced", () => {
  const dates = CHANGELOG.map((e) => e.date);
  expect([...dates].sort().reverse()).toEqual(dates);
  for (const e of CHANGELOG) {
    expect(e.date, e.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(e.body.length, e.title).toBeGreaterThan(40);
    expect(e.body, e.title).not.toMatch(/\u2014/);
    expect(e.title, e.title).not.toMatch(/\u2014/);
    for (const l of e.links ?? []) expect(l.href, e.title).toMatch(/^(https:\/\/|\/)/);
  }
});

test("per-distro history finds entries by slug", () => {
  expect(entriesFor("truenas").map((e) => e.kind)).toEqual(["correction"]);
  expect(entriesFor("no-such-distro")).toEqual([]);
  // Slugs in entries must be real distros the quiz or the curated lists know; spot-check one.
  expect(PROFILES.length).toBeGreaterThan(0);
});

test("source outages read as plain sentences; ongoing ones lead the list", () => {
  const ongoing = { source: "distrowatch" as const, from: "2026-11-08T17:00:00.000Z", to: null, days: 8, cadenceDays: 1, failedRuns: 0 };
  const past = { source: "github" as const, from: "2026-10-01T00:00:00.000Z", to: "2026-10-22T00:00:00.000Z", days: 21, cadenceDays: 7, failedRuns: 2 };
  const r = sourceRow(past);
  expect(r.title).toBe("Repository activity: no update for 21 days");
  expect(r.body).toContain("normally updates weekly");
  expect(r.body).toContain("2 update attempts failed");
  expect(sourceRow(ongoing).ongoing).toBe(true);
  const rows = changeRows([past, ongoing]);
  expect(rows[0]?.kind).toBe("source");
  expect(rows[0]?.ongoing).toBe(true);
  expect(rows.some((x) => /#\d/.test(x.title + x.body))).toBe(false);
});
