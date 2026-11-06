import type { DistroDetail } from "@linux-statistics/shared";
import { FAMILY_LABELS, familyColor } from "../lib/families";
import { formatRating, ratingDetail } from "../lib/rating";

type Stat = [label: string, value: string, title?: string];

/** The headline numbers, leaving out any the distro doesn't have. */
export function statItems(data: DistroDetail): Stat[] {
  const n = (v: number | null) => (v == null ? null : v.toLocaleString("en-US"));
  const out: Array<Stat | null> = [
    data.rank != null ? ["Popularity rank", `#${data.rank}`] : null,
    data.hitsPerDay != null ? ["Hits / day", n(data.hitsPerDay)!] : null,
    data.stars != null ? ["GitHub stars", n(data.stars)!] : null,
    data.commitsLast30d != null ? ["Commits / mo", n(data.commitsLast30d)!] : null,
    data.firstReleaseYear != null ? ["Released", String(data.firstReleaseYear)] : null,
    data.userRating.count > 0 ? ["Community rating", formatRating(data.userRating), ratingDetail(data.userRating)] : null,
    data.usesItCount > 0 ? ["Users", n(data.usesItCount)!] : null,
  ];
  return out.filter((x): x is Stat => x !== null);
}

/** Static distro facts; rendered to HTML at build time (no client JS). */
export function DistroStats({ data, baseName }: { data: DistroDetail; baseName?: string | null }) {
  return (
    <>
      <div className="family-line">
        <span className="family-chip" style={{ background: familyColor(data.family) }} />
        {FAMILY_LABELS[data.family]}
        {data.basedOnSlug ? (
          <>
            {" · based on "}
            <a href={`/distro/${data.basedOnSlug}/`}>{baseName ?? data.basedOnSlug}</a>
          </>
        ) : null}
        {data.status === "discontinued" ? " · discontinued" : ""}
      </div>
      <dl className="stats">
        {statItems(data).map(([label, value, title]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd title={title}>{value}</dd>
          </div>
        ))}
      </dl>
      {data.userRating.count > 0 && (
      <p className="rating-detail">
        {ratingDetail(data.userRating)}
        {data.userRating.count > 0 && data.userRating.mean != null
          ? ` · plain average ${data.userRating.mean.toFixed(1)}`
          : ""}
        {" · "}
        <a href="/about/ratings/">How scores work</a>
      </p>
      )}
      <div className="links">
        {data.homepage && (
          <a href={data.homepage} target="_blank" rel="noopener noreferrer">
            Website ↗
          </a>
        )}
        {data.repoFullName && (
          <a href={`https://github.com/${data.repoFullName}`} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        )}
      </div>
    </>
  );
}
