import { useState } from "react";
import { useDistros } from "../api";
import { ShareCard } from "./ShareCard";
import { DistroHighlights } from "./DistroHighlights";

/** Mobile header menu that holds the summary KPI cards in a dropdown. */
export function StatsMenu() {
  const [open, setOpen] = useState(false);
  const { data } = useDistros();

  return (
    <div className="stats-menu t-acc" data-open={open}>
      <button
        type="button"
        className="stats-menu-btn t-acc-head"
        aria-expanded={open}
        aria-label="Summary stats"
        onClick={() => setOpen((o) => !o)}
      >
        Stats
        <span className="t-acc-chevron" aria-hidden>
          <svg viewBox="0 0 16 16">
            <path d="M4 6.5L8 10.5L12 6.5" />
          </svg>
        </span>
      </button>
      <div className="t-acc-panel">
        <div className="t-acc-panel-inner stats-menu-panel">
          <ShareCard className="stat-card" />
          {data && <DistroHighlights items={data} />}
        </div>
      </div>
    </div>
  );
}
