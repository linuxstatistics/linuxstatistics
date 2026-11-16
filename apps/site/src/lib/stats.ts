import type { MarketSharePoint, StatsPayload } from "@linux-statistics/shared";
import { STATS_SITE_THRESHOLD } from "../config/stats";

export interface SharePoint {
  /** Fractional year, e.g. 2026.75 for October 2026. */
  t: number;
  value: number;
}
export type ShareSeries = Record<"linux" | "macos" | "windows", SharePoint[]>;

const frac = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCFullYear() + d.getUTCMonth() / 12;
};

/**
 * One point per year (January when present, else the year's first month)
 * plus the latest month, per OS. Single months can spike, so the yearly
 * points carry the trend and the last point shows where it is now.
 */
export function shareSeries(points: MarketSharePoint[]): ShareSeries {
  const out: ShareSeries = { linux: [], macos: [], windows: [] };
  for (const os of Object.keys(out) as (keyof ShareSeries)[]) {
    const mine = points.filter((p) => p.platform === os).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    const firstPerYear = new Map<number, MarketSharePoint>();
    for (const p of mine) {
      const y = new Date(p.capturedAt).getUTCFullYear();
      if (!firstPerYear.has(y)) firstPerYear.set(y, p);
    }
    const picked = [...firstPerYear.values()];
    const last = mine[mine.length - 1];
    if (last && picked[picked.length - 1] !== last) picked.push(last);
    out[os] = picked.map((p) => ({ t: frac(p.capturedAt), value: p.sharePct }));
  }
  return out;
}

/** Latest Linux share and its change from the same month a year earlier (points), if both exist. */
export function linuxShareChange(points: MarketSharePoint[]): { value: number; label: string; delta: number | null } | null {
  const linux = points.filter((p) => p.platform === "linux").sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const last = linux[linux.length - 1];
  if (!last) return null;
  const d = new Date(last.capturedAt);
  const yearBefore = new Date(Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), 1)).toISOString().slice(0, 7);
  const prev = linux.find((p) => p.capturedAt.slice(0, 7) === yearBefore);
  const label = d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return { value: last.sharePct, label, delta: prev ? Math.round((last.sharePct - prev.sharePct) * 100) / 100 : null };
}

/** The "This site" section shows only once our own recent traffic is meaningful. */
export const showSiteStats = (s: StatsPayload, threshold = STATS_SITE_THRESHOLD) => s.site.pageViews.last30d >= threshold;

/** Families as bars, leaving out "other" (it would dwarf the rest); its count is returned separately. */
export function familyBars(s: StatsPayload) {
  const known = s.families.filter((f) => f.family !== "other");
  const other = s.families.find((f) => f.family === "other")?.count ?? 0;
  const max = Math.max(1, ...known.map((f) => f.count));
  return { bars: known.map((f) => ({ ...f, pct: Math.round((f.count / max) * 1000) / 10 })), other };
}

export const fmtInt = (n: number) => n.toLocaleString("en-US");
