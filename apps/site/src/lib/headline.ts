import type { DistroListItem } from "@linux-statistics/shared";

export interface Headline {
  /** "CachyOS holds #1." split so the page can colour "#1". */
  leader: string;
  /** Second, regular-weight line, e.g. "Omarchy jumps nine places." */
  mover: { name: string; text: string } | null;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const places = (n: number) => `${n <= 20 ? WORDS[n] : n} place${n === 1 ? "" : "s"}`;

/**
 * Build the home headline from the data: the #1 distro, then the biggest
 * last-month climber in the 12-month top 20 (or, failing that, the top 100).
 * Pure, so the page and the share card can't disagree.
 */
export function buildHeadline(items: DistroListItem[]): Headline | null {
  const ranked = items
    .filter((d): d is DistroListItem & { rank: number } => d.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  const lead = ranked[0];
  if (!lead) return null;
  const pick = (limit: number) =>
    ranked
      .filter((d) => d.rank > 1 && d.rank <= limit && (d.rank1mDelta ?? 0) > 0)
      .sort((a, b) => (b.rank1mDelta ?? 0) - (a.rank1mDelta ?? 0) || a.rank - b.rank)[0];
  const m = pick(20) ?? pick(100);
  return {
    leader: lead.name,
    mover: m ? { name: m.name, text: `jumps ${places(m.rank1mDelta!)}.` } : null,
  };
}
