import { asc } from "drizzle-orm";
import { sourceEvents, type IngestionSource, type SourceEvent } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import { ingestionRuns } from "./schema.js";

/** Source outages for the public changelog, newest first, from the full run history. */
export async function getSourceEvents(db: Database, now: Date = new Date()): Promise<SourceEvent[]> {
  const rows = await db
    .select({ source: ingestionRuns.source, finishedAt: ingestionRuns.finishedAt, status: ingestionRuns.status })
    .from(ingestionRuns)
    .orderBy(asc(ingestionRuns.finishedAt));
  const bySource = new Map<IngestionSource, { finishedAt: string | null; status: string }[]>();
  for (const r of rows) {
    const list = bySource.get(r.source) ?? [];
    list.push({ finishedAt: r.finishedAt?.toISOString() ?? null, status: r.status });
    bySource.set(r.source, list);
  }
  return [...bySource.entries()]
    .flatMap(([source, runs]) => sourceEvents(source, runs, now))
    .sort((a, b) => b.from.localeCompare(a.from) || a.source.localeCompare(b.source));
}
