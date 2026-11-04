import type { MarketSharePoint } from "@linux-statistics/shared";

export interface YearlySharePoint {
  year: number;
  value: number;
}

/** Reduce the raw market-share rows to a sorted yearly Linux series. */
export function linuxYearlySeries(points: MarketSharePoint[]): YearlySharePoint[] {
  return points
    .filter((p) => p.platform === "linux")
    .map((p) => ({ year: new Date(p.capturedAt).getUTCFullYear(), value: p.sharePct }))
    .sort((a, b) => a.year - b.year);
}
