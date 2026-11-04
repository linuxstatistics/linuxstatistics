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

/** The most recent Linux share point, labelled by month ("September 2026"). */
export function latestLinuxShare(points: MarketSharePoint[]): { value: number; label: string } | null {
  const linux = points
    .filter((p) => p.platform === "linux")
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const last = linux[linux.length - 1];
  if (!last) return null;
  const label = new Date(last.capturedAt).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { value: last.sharePct, label };
}
