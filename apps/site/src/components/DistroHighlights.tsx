import type { DistroListItem } from "@linux-statistics/shared";

/** Summary KPI cards derived from the leaderboard data (no extra requests). */
export function DistroHighlights({ items }: { items: DistroListItem[] }) {
  if (!items.length) return null;

  const year = new Date().getFullYear();

  const ranked = items.filter(
    (i): i is DistroListItem & { rank: number } => i.rank !== null,
  );
  const top = ranked.length ? ranked.reduce((a, b) => (b.rank < a.rank ? b : a)) : null;

  const climbers = items.filter(
    (i): i is DistroListItem & { rankTrend: number } => (i.rankTrend ?? 0) > 0,
  );
  const climber = climbers.length
    ? climbers.reduce((a, b) => (b.rankTrend > a.rankTrend ? b : a))
    : null;

  return (
    <>
      {top && (
        <div className="stat-card">
          <div className="hud-stat">
            <span className="label">Top distro</span>
            <span className="value">{top.name}</span>
            <span className="sub">#{top.rank} on DistroWatch</span>
          </div>
        </div>
      )}
      {climber && (
        <div className="stat-card">
          <div className="hud-stat">
            <span className="label">Biggest climber</span>
            <span className="value">{climber.name}</span>
            <span className="sub">DistroWatch · {year}</span>
          </div>
          <span className="trend-chip up">▲ {climber.rankTrend} spots this year</span>
        </div>
      )}
    </>
  );
}
