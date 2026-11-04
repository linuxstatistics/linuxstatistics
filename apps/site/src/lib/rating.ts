import type { UserRating } from "@linux-statistics/shared";

/** "★ 4.2 (12)" or "—". The score is the smoothed average (DEC-0014). */
export function formatRating(r: UserRating): string {
  return r.average != null ? `★ ${r.average.toFixed(1)} (${r.count})` : "—";
}

/** "12 ratings · 100% verified" or "No ratings yet". */
export function ratingDetail(r: UserRating): string {
  if (r.count === 0) return "No ratings yet";
  const pct = Math.round((r.verifiedCount / r.count) * 100);
  return `${r.count} rating${r.count === 1 ? "" : "s"} · ${pct}% from verified accounts`;
}
