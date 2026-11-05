import type { YearlySharePointFull } from "../lib/marketShare";
import { chartPaths } from "../lib/marketShare";

const W = 300;
const H = 96;

/**
 * Yearly Linux desktop share as a small line chart. Green when it grew over
 * the period, red when it shrank. Static SVG, no client JS.
 */
export function ShareChart({ series, className = "" }: { series: YearlySharePointFull[]; className?: string }) {
  const paths = chartPaths(series.map((p) => p.value), W, H);
  if (!paths) return null;
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const up = last.value >= first.value;
  const partial = last.months < 12;
  const summary = `Linux desktop share ${up ? "rose" : "fell"} from ${first.value.toFixed(2)}% in ${first.year} to ${last.value.toFixed(2)}% in ${last.year}${partial ? " so far" : ""} (yearly average).`;
  return (
    <figure className={`share-chart ${up ? "is-up" : "is-down"} ${className}`.trim()}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} preserveAspectRatio="none">
        <title>{summary}</title>
        <line className="sc-base" x1="0" x2={W} y1={H - 4} y2={H - 4} />
        <path className="sc-area" d={paths.area} />
        <path className="sc-line" d={paths.line} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="sc-dot" style={{ left: `${(paths.last[0] / W) * 100}%`, top: `${(paths.last[1] / H) * 100}%` }} aria-hidden="true" />
      <figcaption className="sc-axis" aria-hidden="true">
        <span>
          {first.year} · {first.value.toFixed(1)}%
        </span>
        <span>
          {last.year}
          {partial ? " so far" : ""} · {last.value.toFixed(1)}%
        </span>
      </figcaption>
    </figure>
  );
}
