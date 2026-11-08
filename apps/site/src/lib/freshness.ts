import type { Meta, SourceFreshness } from "@linux-statistics/shared";

const DAY = 86_400_000;

/** How often each source is refreshed in production (matches deploy/systemd/*.timer). */
export const CADENCE_DAYS: Record<SourceFreshness["source"], number> = {
  distrowatch: 1,
  github: 7,
  wikidata: 7,
  statcounter: 31,
  wikipedia: 31,
  endoflife: 7,
};

const LABEL: Record<SourceFreshness["source"], string> = {
  distrowatch: "Rankings",
  github: "Repository activity",
  wikidata: "Distro facts",
  statcounter: "Desktop share",
  wikipedia: "Interest index",
  endoflife: "Release dates",
};

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
