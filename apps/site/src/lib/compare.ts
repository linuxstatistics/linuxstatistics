import type { DistroListItem } from "@linux-statistics/shared";

/** Canonical compare slug: the two keys in alphabetical order. */
export function compareSlug(a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `${x}-vs-${y}`;
}

/** Split "a-vs-b" back into its two keys; null if it isn't a compare slug. */
export function parseCompareSlug(slug: string, known: ReadonlySet<string>): [string, string] | null {
  // Keys can contain "-", so try every "-vs-" split and keep the one where both sides exist.
  let i = slug.indexOf("-vs-");
  while (i !== -1) {
    const a = slug.slice(0, i);
    const b = slug.slice(i + 4);
    if (known.has(a) && known.has(b) && a !== b) return [a, b];
    i = slug.indexOf("-vs-", i + 1);
  }
  return null;
}

/**
 * The pairs we prerender: every pair among the 12-month top N (N=10 gives 45),
 * plus each top-N distro paired with its parent when the parent is tracked.
 */
export function popularPairs(items: DistroListItem[], topN = 10): [string, string][] {
  const ranked = items
    .filter((d): d is DistroListItem & { rank: number } => d.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, topN);
  const seen = new Set<string>();
  const out: [string, string][] = [];
  const add = (a: string, b: string) => {
    if (a === b) return;
    const key = compareSlug(a, b);
    if (seen.has(key)) return;
    seen.add(key);
    out.push([a, b].sort() as [string, string]);
  };
  for (let i = 0; i < ranked.length; i++) {
    for (let j = i + 1; j < ranked.length; j++) add(ranked[i]!.slug, ranked[j]!.slug);
  }
  return out;
}
