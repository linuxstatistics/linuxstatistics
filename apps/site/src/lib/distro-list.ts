import type { DistroListItem, UserRating } from "@linux-statistics/shared";

/**
 * The distro list the islands load after the page (leaderboard rows past the
 * first page, menu search, compare pickers). Built at the same time as the
 * pages, so it matches them. Not part of the open data: robots.txt disallows
 * it, nothing links it and it is left out of the sitemap.
 */
export const LIST_PATH = "/lists/distros.json";

/** Fields the islands use, in row order. Append only: the client checks them. */
export const LIST_FIELDS = [
  "slug",
  "name",
  "family",
  "status",
  "rank",
  "hitsPerDay",
  "stars",
  "commitsLast30d",
  "firstReleaseYear",
  "rankTrend",
  "rank1m",
  "rank1mDelta",
  "ratingAverage",
  "ratingCount",
] as const;

export type ListRow = Pick<
  DistroListItem,
  "slug" | "name" | "family" | "status" | "rank" | "hitsPerDay" | "stars" | "commitsLast30d" | "firstReleaseYear" | "rankTrend" | "rank1m" | "rank1mDelta"
> & { userRating: Pick<UserRating, "average" | "count"> };

export interface PackedList {
  fields: readonly string[];
  rows: (string | number | null)[][];
}

/** The best-ranked distros as search items: what a picker shows before anything is typed. */
export function topSearchItems(items: Pick<ListRow, "slug" | "name" | "rank">[], n: number) {
  return items
    .filter((d) => d.rank != null)
    .sort((a, b) => a.rank! - b.rank!)
    .slice(0, n)
    .map((d) => ({ slug: d.slug, name: d.name, rank: d.rank }));
}

const round3 = (v: number | null) => (v == null ? null : Math.round(v * 1000) / 1000);

/** One array per distro instead of one object: about a third of the size. */
export function packList(items: ListRow[]): PackedList {
  return {
    fields: LIST_FIELDS,
    rows: items.map((d) => [
      d.slug,
      d.name,
      d.family,
      d.status,
      d.rank,
      d.hitsPerDay,
      d.stars,
      d.commitsLast30d,
      d.firstReleaseYear,
      d.rankTrend,
      d.rank1m,
      d.rank1mDelta,
      round3(d.userRating.average),
      d.userRating.count,
    ]),
  };
}

export function unpackList(packed: PackedList): ListRow[] {
  if (!Array.isArray(packed?.fields) || LIST_FIELDS.some((f, i) => packed.fields[i] !== f)) {
    throw new Error("distro list: unexpected fields");
  }
  return packed.rows.map((r) => ({
    slug: r[0] as string,
    name: r[1] as string,
    family: r[2] as ListRow["family"],
    status: r[3] as ListRow["status"],
    rank: r[4] as number | null,
    hitsPerDay: r[5] as number | null,
    stars: r[6] as number | null,
    commitsLast30d: r[7] as number | null,
    firstReleaseYear: r[8] as number | null,
    rankTrend: r[9] as number | null,
    rank1m: r[10] as number | null,
    rank1mDelta: r[11] as number | null,
    userRating: { average: r[12] as number | null, count: r[13] as number },
  }));
}

let pending: Promise<ListRow[]> | null = null;

/** Fetch the list once per page; every island shares the result. A failed fetch can be retried. */
export function loadDistroList(src: string = LIST_PATH): Promise<ListRow[]> {
  if (!pending) {
    pending = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`distro list: ${res.status}`);
        return res.json() as Promise<PackedList>;
      })
      .then(unpackList);
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}

/** Tests only: forget the shared fetch. */
export function resetDistroList() {
  pending = null;
}
