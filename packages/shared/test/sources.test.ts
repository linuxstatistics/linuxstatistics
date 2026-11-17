import { expect, test } from "vitest";
import { sourceEvents } from "../src/sources.js";

const run = (finishedAt: string, status = "success") => ({ finishedAt, status });
const now = new Date("2026-11-16T12:00:00.000Z");

test("on-schedule runs make no events", () => {
  expect(sourceEvents("github", [run("2026-11-01T00:00:00Z"), run("2026-11-08T00:00:00Z"), run("2026-11-15T00:00:00Z")], now)).toEqual([]);
});

test("a gap over twice the cadence is one event, with the failed runs inside it", () => {
  const ev = sourceEvents("github", [run("2026-10-01T00:00:00Z"), run("2026-10-08T00:00:00Z", "failed"), run("2026-10-15T00:00:00Z", "failed"), run("2026-10-22T00:00:00Z"), run("2026-10-29T00:00:00Z")], new Date("2026-11-05T00:00:00Z"));
  expect(ev).toEqual([{ source: "github", from: "2026-10-01T00:00:00Z", to: "2026-10-22T00:00:00Z", days: 21, cadenceDays: 7, failedRuns: 2 }]);
});

test("a gap that lasts until now is ongoing (to = null)", () => {
  const ev = sourceEvents("distrowatch", [run("2026-11-08T00:00:00Z"), run("2026-11-10T00:00:00Z", "failed")], now);
  expect(ev).toHaveLength(1);
  expect(ev[0]).toMatchObject({ to: null, days: 8, failedRuns: 1 });
});

test("unfinished runs are ignored; a source that never succeeded has no events", () => {
  expect(sourceEvents("wikidata", [{ finishedAt: null, status: "running" }, run("2026-01-01T00:00:00Z", "failed")], now)).toEqual([]);
});

test("exactly twice the cadence is still on time", () => {
  expect(sourceEvents("github", [run("2026-11-01T12:00:00Z"), run("2026-11-15T12:00:00Z")], new Date("2026-11-16T00:00:00Z"))).toEqual([]);
});
