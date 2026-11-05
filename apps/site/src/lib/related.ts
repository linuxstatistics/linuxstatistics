import type { DistroListItem } from "@linux-statistics/shared";
import { compareSlug } from "./compare";

export interface RelatedLink {
  slug: string;
  name: string;
  rank: number | null;
}

export interface CompareLink {
  href: string;
  label: string;
}

const byRank = (a: DistroListItem, b: DistroListItem) => (a.rank ?? 1e9) - (b.rank ?? 1e9);
const link = (d: DistroListItem): RelatedLink => ({ slug: d.slug, name: d.name, rank: d.rank });

/** The distros ranked just above and below this one (up to `span` each side). */
export function neighbours(items: DistroListItem[], slug: string, span = 2): RelatedLink[] {
  const ranked = items.filter((d) => d.rank != null).sort(byRank);
  const i = ranked.findIndex((d) => d.slug === slug);
  if (i === -1) return [];
  return ranked.slice(Math.max(0, i - span), i + span + 1).filter((d) => d.slug !== slug).map(link);
}

/**
 * Other ranked distros in the same family, best first. Distros based on this
 * one come first, since they're the closest relatives.
 */
export function sameFamily(
  items: DistroListItem[],
  self: { slug: string; family: DistroListItem["family"] },
  basedOn: ReadonlyMap<string, string | null>,
  limit = 6,
): RelatedLink[] {
  if (self.family === "other") return [];
  const peers = items
    .filter((d) => d.slug !== self.slug && d.family === self.family && d.rank != null)
    .sort((a, b) => {
      const ca = basedOn.get(a.slug) === self.slug ? 0 : 1;
      const cb = basedOn.get(b.slug) === self.slug ? 0 : 1;
      return ca - cb || byRank(a, b);
    });
  return peers.slice(0, limit).map(link);
}

/** Href for a pair: its static page when prerendered, else the any-pair view. */
export function compareHref(a: string, b: string, staticPairs: ReadonlySet<string>): string {
  const slug = compareSlug(a, b);
  return staticPairs.has(slug) ? `/compare/${slug}/` : `/compare/?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
}

/**
 * Comparisons worth offering from one distro: its base first, then its rank
 * neighbours, then the top of the chart. Prerendered pairs win ties.
 */
export function compareSuggestions(
  items: DistroListItem[],
  self: { slug: string; name: string; basedOnSlug: string | null },
  staticPairs: ReadonlySet<string>,
  limit = 6,
): CompareLink[] {
  const name = new Map(items.map((d) => [d.slug, d.name]));
  const order: string[] = [];
  const push = (s: string | null | undefined) => {
    if (s && s !== self.slug && name.has(s) && !order.includes(s)) order.push(s);
  };
  push(self.basedOnSlug);
  for (const d of neighbours(items, self.slug, 3)) push(d.slug);
  for (const d of items.filter((x) => x.rank != null).sort(byRank).slice(0, 10)) push(d.slug);
  const prerendered = order.filter((s) => staticPairs.has(compareSlug(self.slug, s)));
  const rest = order.filter((s) => !staticPairs.has(compareSlug(self.slug, s)));
  // keep the base first even when its pair isn't prerendered
  const base = self.basedOnSlug && order[0] === self.basedOnSlug ? [self.basedOnSlug] : [];
  const picked = [...base, ...prerendered, ...rest].filter((s, i, a) => a.indexOf(s) === i).slice(0, limit);
  return picked.map((s) => ({ href: compareHref(self.slug, s, staticPairs), label: `${self.name} vs ${name.get(s)}` }));
}
