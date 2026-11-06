import type { DistroDetail } from "@linux-statistics/shared";

const LABEL: Record<string, string> = {
  "last-1-month": "Last month",
  "last-3-months": "3 months",
  "last-6-months": "6 months",
  "last-12-months": "12 months",
};

/**
 * Popularity rank in each period, shortest first. The bar shows hits/day
 * relative to the busiest period. Static HTML.
 */
export function RankByPeriod({ periods }: { periods: DistroDetail["rankByPeriod"] | undefined }) {
  if (!periods || periods.length < 2) return null;
  const max = Math.max(1, ...periods.map((p) => p.hitsPerDay));
  const main = periods.find((p) => p.period === "last-12-months");
  return (
    <section className="rank-periods" aria-labelledby="rank-periods-h">
      <h2 id="rank-periods-h">Rank over time</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Window</th>
            <th className="num">Rank</th>
            <th className="num">Hits / day</th>
            <th aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => {
            const diff = main && p !== main ? main.rank - p.rank : 0;
            return (
              <tr key={p.period}>
                <th scope="row">{LABEL[p.period] ?? p.period}</th>
                <td className="num">
                  #{p.rank}
                  {diff !== 0 && (
                    <span className={`trend ${diff > 0 ? "up" : "down"}`} title="Compared with the 12-month rank">
                      {" "}
                      {diff > 0 ? `▲ ${diff}` : `▼ ${-diff}`}
                    </span>
                  )}
                </td>
                <td className="num">{p.hitsPerDay.toLocaleString("en-US")}</td>
                <td className="bar-cell">
                  <i className="bar" style={{ width: `${((p.hitsPerDay / max) * 100).toFixed(0)}%` }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="note">Shorter windows react faster. A better rank there than over 12 months means interest is growing.</p>
    </section>
  );
}
