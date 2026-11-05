import type { MarketSharePoint } from "@linux-statistics/shared";

export interface YearlySharePoint {
  year: number;
  value: number;
}

export interface YearlySharePointFull extends YearlySharePoint {
  /** Months of data behind the average (12 for a full year). */
  months: number;
}

/**
 * Linux share averaged per calendar year, oldest first. Monthly StatCounter
 * figures jump around, so the average shows the trend.
 */
export function linuxYearlySeries(points: MarketSharePoint[]): YearlySharePointFull[] {
  const byYear = new Map<number, number[]>();
  for (const p of points) {
    if (p.platform !== "linux") continue;
    const y = new Date(p.capturedAt).getUTCFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), p.sharePct]);
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, v]) => ({ year, value: Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 100) / 100, months: v.length }));
}

/** SVG line and area paths for a series, scaled into a width x height box. */
export function chartPaths(values: number[], width: number, height: number, pad = 4) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = 0; // share charts start at zero so growth isn't exaggerated
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2);
  const pts = values.map((v, i) => [Number(x(i).toFixed(1)), Number(y(v).toFixed(1))] as const);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px} ${py}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]![0]} ${height - pad} L${pts[0]![0]} ${height - pad} Z`;
  return { line, area, last: pts[pts.length - 1]!, first: pts[0]! };
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
