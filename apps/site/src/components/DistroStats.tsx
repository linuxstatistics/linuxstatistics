import { RANK_SOURCE, RANK_VALUE_LABEL, type DistroDetail } from "@linux-statistics/shared";
import { FAMILY_LABELS, familyColor } from "../lib/families";
import { formatRating, ratingDetail } from "../lib/rating";

type Stat = [label: string, value: string, title?: string];

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** Current release line and support end from the newest cycle, when a lifecycle source covers the distro. */
export function releaseStats(data: DistroDetail, today = new Date().toISOString().slice(0, 10)): Stat[] {
  const cur = data.releases.find((r) => r.releasedOn != null && r.releasedOn <= today) ?? data.releases[0];
  if (!cur) return [];
  const out: Stat[] = [];
  const version = cur.latest ?? cur.cycle;
  out.push(["Latest release", version + (cur.lts ? " LTS" : ""), [cur.codename, cur.latestOn ? `released ${fmtDay(cur.latestOn)}` : null].filter(Boolean).join(", ") || undefined]);
  const end = cur.supportEnds ?? cur.eol;
  if (end) out.push([end < today ? "Support ended" : "Supported until", fmtDay(end), cur.eol && cur.eol !== end ? `extended support to ${fmtDay(cur.eol)}` : undefined]);
  return out;
}

/** The headline numbers, leaving out any the distro doesn't have. */
export function statItems(data: DistroDetail): Stat[] {
  const n = (v: number | null) => (v == null ? null : v.toLocaleString("en-US"));
  const out: Array<Stat | null> = [
    data.rank != null ? ["Popularity rank", `#${data.rank}`] : null,
    data.hitsPerDay != null ? [RANK_VALUE_LABEL[RANK_SOURCE], n(data.hitsPerDay)!] : null,
    data.stars != null ? ["GitHub stars", n(data.stars)!] : null,
    data.commitsLast30d != null ? ["Commits / mo", n(data.commitsLast30d)!] : null,
    data.firstReleaseYear != null ? ["Released", String(data.firstReleaseYear)] : null,
    ...releaseStats(data),
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
