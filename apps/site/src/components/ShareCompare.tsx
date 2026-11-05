import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { OSES, OS_LABEL, changeRows, lastYears, niceTicks, summaries, type Os, type YearRow } from "../lib/share-compare";

type View = "share" | "change";
const RANGES: { years: number; label: string }[] = [
  { years: 0, label: "All" },
  { years: 10, label: "10 years" },
  { years: 5, label: "5 years" },
];

const W = 1000;
const H = 400;

const fmtPct = (v: number) => `${v.toFixed(v >= 10 ? 1 : 2)}%`;
const fmtPts = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)} pts`;

/**
 * Windows, macOS and Linux desktop share on one chart. Renders to HTML at
 * build time; the controls and hover readout need JS.
 */
export function ShareCompare({ rows: all }: { rows: YearRow[] }) {
  const [view, setView] = useState<View>("share");
  const [range, setRange] = useState(0);
  const [shown, setShown] = useState<Record<Os, boolean>>({ windows: true, macos: true, linux: true });
  const [hover, setHover] = useState<number | null>(null);

  const ranged = useMemo(() => lastYears(all, range), [all, range]);
  const rows = useMemo(() => (view === "change" ? changeRows(ranged) : ranged), [ranged, view]);
  const sums = useMemo(() => summaries(ranged), [ranged]);
  const active = OSES.filter((o) => shown[o]);

  const vals = rows.flatMap((r) => active.map((o) => r.values[o]));
  const ticks = niceTicks(vals.length ? Math.min(...vals) : 0, vals.length ? Math.max(...vals) : 1);
  const lo = ticks[0]!;
  const hi = ticks[ticks.length - 1]!;
  const x = (i: number) => (rows.length > 1 ? (i / (rows.length - 1)) * W : W / 2);
  const y = (v: number) => H - ((v - lo) / (hi - lo || 1)) * H;
  const path = (o: Os) => rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(r.values[o]).toFixed(1)}`).join(" ");

  const first = rows[0];
  const last = rows[rows.length - 1];
  const idx = hover ?? rows.length - 1;
  const at = rows[idx];
  const partial = last && last.months < 12;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const t = (e.clientX - box.left) / box.width;
    setHover(Math.max(0, Math.min(rows.length - 1, Math.round(t * (rows.length - 1)))));
  }
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") setHover(Math.max(0, idx - 1));
    else if (e.key === "ArrowRight") setHover(Math.min(rows.length - 1, idx + 1));
    else if (e.key === "Home") setHover(0);
    else if (e.key === "End") setHover(rows.length - 1);
    else return;
    e.preventDefault();
  }

  const summary = first && last
    ? `${view === "share" ? "Desktop share" : "Change in desktop share"} from ${first.year} to ${last.year}: ` +
      active.map((o) => `${OS_LABEL[o]} ${view === "share" ? `${fmtPct(first.values[o])} to ${fmtPct(last.values[o])}` : fmtPts(last.values[o])}`).join("; ") +
      "."
    : "No data.";

  return (
    <div className="sc-cmp">
      <div className="sc-controls">
        <div className="seg" role="group" aria-label="Show">
          <button type="button" aria-pressed={view === "share"} onClick={() => setView("share")}>Share</button>
          <button type="button" aria-pressed={view === "change"} onClick={() => setView("change")}>Growth</button>
        </div>
        <div className="seg" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.years} type="button" aria-pressed={range === r.years} onClick={() => { setRange(r.years); setHover(null); }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sc-legend" role="group" aria-label="Systems on the chart">
        {OSES.map((o) => {
          const s = sums.find((x) => x.os === o)!;
          const at2 = at?.values[o];
          return (
            <button
              key={o}
              type="button"
              className={`sc-key os-${o}`}
              aria-pressed={shown[o]}
              disabled={shown[o] && active.length === 1}
              title={shown[o] ? `Hide ${OS_LABEL[o]}` : `Show ${OS_LABEL[o]}`}
              onClick={() => setShown((v) => ({ ...v, [o]: !v[o] }))}
            >
              <span className="sc-swatch" aria-hidden="true" />
              <span className="sc-key-name">{OS_LABEL[o]}</span>
              <span className="sc-key-val">{at2 == null ? "-" : view === "share" ? fmtPct(at2) : fmtPts(at2)}</span>
              {s && (
                <span className={`sc-key-delta ${s.delta > 0 ? "up" : s.delta < 0 ? "down" : ""}`}>
                  {s.delta > 0 ? "▲" : s.delta < 0 ? "▼" : "="} {Math.abs(s.delta).toFixed(1)} pts since {first?.year}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="sc-hint">
        {view === "share"
          ? "Tap a name to hide it. Hide Windows to zoom in on macOS and Linux."
          : `Points gained or lost since ${first?.year ?? "the start"}. Above the line grew, below it shrank.`}
      </p>

      <div className="sc-plot">
        <div className="sc-yaxis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ top: `${(y(t) / H) * 100}%` }}>
              {view === "change" && t > 0 ? "+" : ""}
              {t}
              {view === "share" ? "%" : ""}
            </span>
          ))}
        </div>
        <div
          className="sc-area"
          tabIndex={0}
          role="img"
          aria-label={summary}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {ticks.map((t) => (
              <line key={t} className={t === 0 && view === "change" ? "sc-zero" : "sc-grid"} x1="0" x2={W} y1={y(t)} y2={y(t)} vectorEffect="non-scaling-stroke" />
            ))}
            {view === "change" && <rect className="sc-below" x="0" y={y(0)} width={W} height={Math.max(0, H - y(0))} />}
            {hover != null && <line className="sc-guide" x1={x(idx)} x2={x(idx)} y1="0" y2={H} vectorEffect="non-scaling-stroke" />}
            {active.map((o) => (
              <path key={o} className={`sc-line os-${o}`} d={path(o)} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {at &&
            active.map((o) => (
              <span
                key={o}
                className={`sc-pt os-${o}`}
                style={{ left: `${(x(idx) / W) * 100}%`, top: `${(y(at.values[o]) / H) * 100}%` }}
                aria-hidden="true"
              />
            ))}
          {at && hover != null && (
            <div className={`sc-tip ${x(idx) > W * 0.6 ? "left" : ""}`} style={{ left: `${(x(idx) / W) * 100}%` }} aria-hidden="true">
              <b>
                {at.year}
                {at.months < 12 ? " so far" : ""}
              </b>
              {active
                .slice()
                .sort((a, b) => at.values[b] - at.values[a])
                .map((o) => (
                  <span key={o} className={`os-${o}`}>
                    <i className="sc-swatch" />
                    {OS_LABEL[o]} {view === "share" ? fmtPct(at.values[o]) : fmtPts(at.values[o])}
                  </span>
                ))}
            </div>
          )}
        </div>
        <div className="sc-xaxis" aria-hidden="true">
          <span>{first?.year}</span>
          {rows.length > 6 && <span>{rows[Math.floor((rows.length - 1) / 2)]?.year}</span>}
          <span>
            {last?.year}
            {partial ? " so far" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
