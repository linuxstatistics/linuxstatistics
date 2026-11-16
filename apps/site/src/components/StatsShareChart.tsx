import type { ShareSeries } from "../lib/stats";

const W = 900;
const H = 300;
const L = 44;
const R = 16;
const T = 14;
const B = 28;
const MAX = 20;

/**
 * Desktop share since the first year, scaled 0–20% so Linux and macOS read;
 * Windows sits off the top and is named in a label. Static SVG; lines draw
 * in when the page script adds `.in` to the parent.
 */
export function StatsShareChart({ series }: { series: ShareSeries }) {
  const all = [...series.linux, ...series.macos];
  if (series.linux.length < 2) return null;
  const t0 = Math.floor(Math.min(...all.map((p) => p.t)));
  const t1 = Math.max(...all.map((p) => p.t));
  const x = (t: number) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R);
  const y = (v: number) => T + (1 - Math.min(v, MAX) / MAX) * (H - T - B);
  const path = (pts: { t: number; value: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const years: number[] = [];
  for (let yr = t0; yr <= Math.floor(t1); yr += 4) years.push(yr);
  const lastLinux = series.linux[series.linux.length - 1]!;
  const lastWin = series.windows[series.windows.length - 1];
  return (
    <svg className="stats-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Linux desktop share went from ${series.linux[0]!.value}% in ${t0} to ${lastLinux.value}% in the latest month`}>
      {[0, 5, 10, 15, 20].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stats-gridline" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end">{v}%</text>
        </g>
      ))}
      {years.map((yr) => (
        <text key={yr} x={x(yr)} y={H - 6} textAnchor="middle">{yr}</text>
      ))}
      {lastWin && (
        <text x={W - R} y={T + 10} textAnchor="end">Windows {lastWin.value}% (off scale)</text>
      )}
      <path className="stats-line stats-draw os-macos" d={path(series.macos)} pathLength={1} />
      <path className="stats-line stats-draw os-linux" d={path(series.linux)} pathLength={1} />
      <circle cx={x(lastLinux.t)} cy={y(lastLinux.value)} r={5} className="stats-dot" />
      <text x={x(lastLinux.t) - 10} y={y(lastLinux.value) - 12} textAnchor="end" className="stats-callout">Linux {lastLinux.value}%</text>
    </svg>
  );
}
