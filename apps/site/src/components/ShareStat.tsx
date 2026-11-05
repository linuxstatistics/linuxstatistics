import type { YearlySharePoint, YearlySharePointFull } from "../lib/marketShare";
import { ShareChart } from "./ShareChart";

export interface ShareStatProps {
  series: YearlySharePoint[];
  className?: string;
  /** Latest month, shown as the big number when given. */
  latest?: { value: number; label: string } | null;
  hint?: string;
}

/** Clean KPI display of Linux desktop share + growth-since-first-year chip. */
export function ShareStat({ series, className, hint, latest: month }: ShareStatProps) {
  const latest = series.length ? series[series.length - 1] : undefined;
  const full = series.every((p) => "months" in p) ? (series as YearlySharePointFull[]) : null;
  const first = series.length ? series[0] : undefined;
  const deltaPts = latest && first ? latest.value - first.value : null;

  return (
    <div className={className}>
      <div className="hud-stat">
        <span className="label">Linux desktop share</span>
        <span className="value">{month ? `${month.value.toFixed(2)}%` : latest ? `${latest.value.toFixed(2)}%` : "-"}</span>
        <span className="sub">global{month ? ` · ${month.label}` : latest ? ` · ${latest.year}` : ""}</span>
      </div>
      {full && full.length > 1 && <ShareChart series={full} />}
      {deltaPts !== null && deltaPts > 0 && first && (
        <span className="trend-chip up">
          ▲ +{deltaPts.toFixed(1)} pts since {first.year} (yearly average)
        </span>
      )}
      {hint && <div className="hud-hint">{hint}</div>}
    </div>
  );
}
