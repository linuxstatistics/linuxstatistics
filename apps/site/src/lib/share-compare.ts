import type { MarketSharePoint } from "@linux-statistics/shared";

export type Os = "windows" | "macos" | "linux";
export const OSES: Os[] = ["windows", "macos", "linux"];
export const OS_LABEL: Record<Os, string> = { windows: "Windows", macos: "macOS", linux: "Linux" };

export interface YearRow {
  year: number;
  /** Months of data behind the averages (12 for a full year). */
  months: number;
  values: Record<Os, number>;
}

/** Yearly average share per desktop OS, oldest first. Years missing an OS are dropped. */
export function yearlyByOs(points: MarketSharePoint[]): YearRow[] {
  const acc = new Map<number, { n: Record<Os, number>; sum: Record<Os, number> }>();
  for (const p of points) {
    if (!OSES.includes(p.platform as Os)) continue;
    const os = p.platform as Os;
    const y = new Date(p.capturedAt).getUTCFullYear();
    const a = acc.get(y) ?? { n: { windows: 0, macos: 0, linux: 0 }, sum: { windows: 0, macos: 0, linux: 0 } };
    a.n[os]++;
    a.sum[os] += p.sharePct;
    acc.set(y, a);
  }
  return [...acc.entries()]
    .filter(([, a]) => OSES.every((o) => a.n[o] > 0))
    .sort((x, y) => x[0] - y[0])
    .map(([year, a]) => ({
      year,
      months: Math.max(...OSES.map((o) => a.n[o])),
      values: Object.fromEntries(OSES.map((o) => [o, round2(a.sum[o] / a.n[o])])) as Record<Os, number>,
    }));
}

/** Rows from `years` back (0 = all). */
export function lastYears(rows: YearRow[], years: number): YearRow[] {
  return years > 0 ? rows.slice(-years - 1) : rows;
}

/** Each value minus its value in the first row: points gained or lost. */
export function changeRows(rows: YearRow[]): YearRow[] {
  const base = rows[0];
  if (!base) return [];
  return rows.map((r) => ({
    ...r,
    values: Object.fromEntries(OSES.map((o) => [o, round2(r.values[o] - base.values[o])])) as Record<Os, number>,
  }));
}

export interface OsSummary {
  os: Os;
  from: number;
  to: number;
  /** Percentage points. */
  delta: number;
  /** to / from, e.g. 7.6 for "7.6 times". */
  ratio: number | null;
}

export function summaries(rows: YearRow[]): OsSummary[] {
  const a = rows[0];
  const b = rows[rows.length - 1];
  if (!a || !b) return [];
  return OSES.map((os) => ({
    os,
    from: a.values[os],
    to: b.values[os],
    delta: round2(b.values[os] - a.values[os]),
    ratio: a.values[os] > 0 ? Math.round((b.values[os] / a.values[os]) * 10) / 10 : null,
  }));
}

/** Round axis ticks covering [min, max], always including 0. */
export function niceTicks(min: number, max: number, target = 5): number[] {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  const span = hi - lo || 1;
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= target) ?? 10 * mag;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + step / 1000; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
