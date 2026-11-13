/** Last-month rank compared with the 12-month rank, not movement since yesterday. */
export function RankDifference({ value }: { value: number | null }) {
  if (value == null) return <span className="trend flat" title="No last-month ranking available to compare">No data</span>;
  if (value === 0) return <span className="trend flat" title="Same position in the last-month and 12-month rankings" aria-label="Same position in the last-month and 12-month rankings">– 0</span>;
  const places = `${Math.abs(value)} ${Math.abs(value) === 1 ? "place" : "places"}`;
  const label = `${places} ${value > 0 ? "higher" : "lower"} in the last-month ranking than the 12-month ranking`;
  return <span className={`trend ${value > 0 ? "up" : "down"}`} title={label} aria-label={label}>{value > 0 ? "▲" : "▼"} {Math.abs(value)}</span>;
}
