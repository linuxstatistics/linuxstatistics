import type { IngestionSource } from "./schemas.js";

/** How often each source is refreshed in production. */
export const SOURCE_CADENCE_DAYS: Record<IngestionSource, number> = {
  distrowatch: 1,
  github: 7,
  wikidata: 7,
  statcounter: 31,
  wikipedia: 31,
  endoflife: 7,
  descriptions: 7,
};

/** Plain names for what each source feeds on the site. */
export const SOURCE_LABEL: Record<IngestionSource, string> = {
  distrowatch: "Rankings",
  github: "Repository activity",
  wikidata: "Distro facts",
  statcounter: "Desktop share",
  wikipedia: "Interest index",
  endoflife: "Release dates",
  descriptions: "Distro descriptions",
};

const DAY = 86_400_000;

export interface SourceEvent {
  source: IngestionSource;
  /** Last successful run before the gap (ISO). */
  from: string;
  /** First successful run after the gap (ISO), or null while it lasts. */
  to: string | null;
  /** Whole days without a successful update. */
  days: number;
  cadenceDays: number;
  /** Failed runs during the gap. */
  failedRuns: number;
}

/**
 * Gaps longer than twice a source's cadence, from its run history (the same rule
 * as the site's freshness notice). `runs` is any order; only finished runs count.
 * A source that never succeeded has no events: there is no data to be late.
 */
export function sourceEvents(
  source: IngestionSource,
  runs: { finishedAt: string | null; status: string }[],
  now: Date = new Date(),
): SourceEvent[] {
  const cadence = SOURCE_CADENCE_DAYS[source];
  const done = runs.filter((r) => r.finishedAt != null).sort((a, b) => a.finishedAt!.localeCompare(b.finishedAt!));
  const ok = done.filter((r) => r.status === "success").map((r) => r.finishedAt!);
  const out: SourceEvent[] = [];
  const failedBetween = (a: string, b: string | null) => done.filter((r) => r.status === "failed" && r.finishedAt! > a && (b == null || r.finishedAt! < b)).length;
  for (let i = 0; i < ok.length; i++) {
    const from = ok[i]!;
    const to = ok[i + 1] ?? null;
    const end = to ? new Date(to).getTime() : now.getTime();
    const days = (end - new Date(from).getTime()) / DAY;
    if (days > cadence * 2) out.push({ source, from, to, days: Math.floor(days), cadenceDays: cadence, failedRuns: failedBetween(from, to) });
  }
  return out;
}
