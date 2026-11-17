import { beforeAll, expect, test } from "vitest";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import { getSourceEvents, schema } from "../src/index.js";

let db: Database;

beforeAll(async () => {
  ({ db } = await setupTestDb());
  const r = (source: "github" | "wikipedia", status: "success" | "failed", finishedAt: string) => ({ source, status, finishedAt: new Date(finishedAt), rowsWritten: 0 });
  await db.insert(schema.ingestionRuns).values([
    r("github", "success", "2026-10-01T00:00:00Z"),
    r("github", "failed", "2026-10-08T00:00:00Z"),
    r("github", "success", "2026-10-22T00:00:00Z"),
    r("github", "success", "2026-10-29T00:00:00Z"),
    r("wikipedia", "success", "2026-09-01T00:00:00Z"),
    r("wikipedia", "success", "2026-10-01T00:00:00Z"),
  ]);
});

test("source events come from the run history, newest first", async () => {
  const ev = await getSourceEvents(db, new Date("2026-11-03T00:00:00Z"));
  expect(ev).toEqual([{ source: "github", from: "2026-10-01T00:00:00.000Z", to: "2026-10-22T00:00:00.000Z", days: 21, cadenceDays: 7, failedRuns: 1 }]);
});

test("an ongoing outage shows up once the gap passes twice the cadence", async () => {
  const ev = await getSourceEvents(db, new Date("2026-12-15T00:00:00Z"));
  expect(ev.map((e) => [e.source, e.to])).toEqual([["github", null], ["github", "2026-10-22T00:00:00.000Z"], ["wikipedia", null]]);
});
