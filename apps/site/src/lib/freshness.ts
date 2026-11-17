import { SOURCE_CADENCE_DAYS, SOURCE_LABEL, type Meta, type SourceFreshness } from "@linux-statistics/shared";

const DAY = 86_400_000;

/** How often each source is refreshed in production. */
export const CADENCE_DAYS = SOURCE_CADENCE_DAYS;
const LABEL = SOURCE_LABEL;

export type StaleSource = { source: SourceFreshness["source"]; label: string; days: number; ago: string };

export function daysAgoText(days: number): string {
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 14) return `${Math.floor(days)} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Sources whose last successful run is older than twice their cadence.
 * Sources that never ran are not "stale": they have nothing to show yet.
 */
export function staleSources(meta: Meta, now: Date = new Date()): StaleSource[] {
  const out: StaleSource[] = [];
  for (const s of meta.sources) {
    if (!s.lastSuccessAt) continue;
    const days = (now.getTime() - new Date(s.lastSuccessAt).getTime()) / DAY;
    if (days > CADENCE_DAYS[s.source] * 2) out.push({ source: s.source, label: LABEL[s.source], days, ago: daysAgoText(days) });
  }
  return out;
}
