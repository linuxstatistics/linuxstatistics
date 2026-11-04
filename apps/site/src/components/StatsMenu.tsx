import { useState } from "react";
import type { DistroListItem, MarketSharePoint } from "@linux-statistics/shared";
import { ShareCard } from "./ShareCard";
import { DistroHighlights } from "./DistroHighlights";

/** Collapsible panel holding the summary KPI cards (used on narrow screens). */
export function StatsMenu({
  items,
  marketShare,
}: {
  items: DistroListItem[];
  marketShare: MarketSharePoint[];
}) {
  const [open, setOpen] = useState(false);

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
          <ShareCard points={marketShare} className="stat-card" />
          <DistroHighlights items={items} />
        </div>
      </div>
    </div>
  );
}
