import type { DistroDetail } from "@linux-statistics/shared";
import { FAMILY_LABELS, familyColor } from "../lib/families";
import { formatRating, ratingDetail } from "../lib/rating";

/** Static distro facts; rendered to HTML at build time (no client JS). */
export function DistroStats({ data }: { data: DistroDetail }) {
  return (
    <>
      <div className="family-line">
        <span className="family-chip" style={{ background: familyColor(data.family) }} />
        {FAMILY_LABELS[data.family]}
        {data.basedOnSlug ? (
          <>
            {" · based on "}
            <a href={`/distro/${data.basedOnSlug}/`}>{data.basedOnSlug}</a>
          </>
        ) : null}
        {data.status === "discontinued" ? " · discontinued" : ""}
      </div>
      <dl className="stats">
        <div>
          <dt>DistroWatch rank</dt>
          <dd>{data.rank ?? "—"}</dd>
        </div>
        <div>
          <dt>Hits / day</dt>
          <dd>{data.hitsPerDay?.toLocaleString("en-US") ?? "—"}</dd>
        </div>
        <div>
          <dt>GitHub</dt>
          <dd>{data.stars?.toLocaleString("en-US") ?? "—"}</dd>
        </div>
        <div>
          <dt>Commits / mo</dt>
          <dd>{data.commitsLast30d?.toLocaleString("en-US") ?? "—"}</dd>
        </div>
        <div>
          <dt>Released</dt>
          <dd>{data.firstReleaseYear ?? "—"}</dd>
        </div>
        <div>
          <dt>Community rating</dt>
          <dd title={ratingDetail(data.userRating)}>{formatRating(data.userRating)}</dd>
        </div>
        <div>
          <dt>Users</dt>
          <dd>{data.usesItCount > 0 ? data.usesItCount.toLocaleString("en-US") : "—"}</dd>
        </div>
      </dl>
      <p className="rating-detail">
        {ratingDetail(data.userRating)}
        {data.userRating.count > 0 && data.userRating.mean != null
          ? ` · plain average ${data.userRating.mean.toFixed(1)}`
          : ""}
        {" · "}
        <a href="/about/ratings/">How scores work</a>
      </p>
      <div className="links">
        {data.homepage && (
          <a href={data.homepage} target="_blank" rel="noreferrer">
            Website ↗
          </a>
        )}
        {data.repoFullName && (
          <a href={`https://github.com/${data.repoFullName}`} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        )}
      </div>
    </>
  );
}
