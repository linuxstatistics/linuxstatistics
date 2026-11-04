import type { YearlySharePoint } from "../lib/marketShare";

export interface ShareStatProps {
  series: YearlySharePoint[];
  className?: string;
  hint?: string;
}

/** Clean KPI display of Linux desktop share + growth-since-first-year chip. */
export function ShareStat({ series, className, hint }: ShareStatProps) {
  const latest = series.length ? series[series.length - 1] : undefined;
  const first = series.length ? series[0] : undefined;
  const deltaPts = latest && first ? latest.value - first.value : null;

  return (
    <div className={className}>
      <div className="hud-stat">
        <span className="label">Linux desktop share</span>
        <span className="value">{latest ? `${latest.value.toFixed(2)}%` : "-"}</span>
        <span className="sub">global{latest ? ` · ${latest.year}` : ""}</span>
      </div>
      {deltaPts !== null && deltaPts > 0 && first && (
        <span className="trend-chip up">
          ▲ +{deltaPts.toFixed(1)} pts since {first.year}
        </span>
      )}
      {hint && <div className="hud-hint">{hint}</div>}
    </div>
  );
}
