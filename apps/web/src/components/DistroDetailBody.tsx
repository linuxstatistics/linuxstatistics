import type { DistroDetail, Me } from "@linux-statistics/shared";
import { FAMILY_LABELS, familyColor } from "../lib/families";
import { RatingWidget } from "./RatingWidget";
import { AffiliateBlock } from "./AffiliateBlock";
import { useMe, useUpsertContribution, useDeleteContribution } from "../api";

/** Shared detail content used by the detail panel and the List inline row. */
export function DistroDetailBody({
  data,
  showName = true,
}: {
  data: DistroDetail;
  showName?: boolean;
}) {
  const { data: me } = useMe();
  const save = useUpsertContribution(data.slug);
  const remove = useDeleteContribution(data.slug);
  return (
    <>
      {showName && <h2>{data.name}</h2>}
      <div className="family-line">
        <span className="family-chip" style={{ background: familyColor(data.family) }} />
        {FAMILY_LABELS[data.family]}
        {data.basedOnSlug ? ` · based on ${data.basedOnSlug}` : ""}
        {data.status === "discontinued" ? " · discontinued" : ""}
      </div>
      <dl className="stats">
        <div>
          <dt>DistroWatch rank</dt>
          <dd>{data.rank ?? "—"}</dd>
        </div>
        <div>
          <dt>Hits / day</dt>
          <dd>{data.hitsPerDay?.toLocaleString() ?? "—"}</dd>
        </div>
        <div>
          <dt>GitHub</dt>
          <dd>{data.stars?.toLocaleString() ?? "—"}</dd>
        </div>
        <div>
          <dt>Commits / mo</dt>
          <dd>{data.commitsLast30d?.toLocaleString() ?? "—"}</dd>
        </div>
        <div>
          <dt>Released</dt>
          <dd>{data.firstReleaseYear ?? "—"}</dd>
        </div>
        <div>
          <dt>Community rating</dt>
          <dd>
            {data.userRating.average != null
              ? `★ ${data.userRating.average.toFixed(1)} (${data.userRating.count})`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Users</dt>
          <dd>{data.usesItCount > 0 ? data.usesItCount.toLocaleString() : "—"}</dd>
        </div>
      </dl>
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
      <RatingWidget
        me={(me ?? null) as Me | null}
        mine={data.myContribution}
        onSave={(c) => save.mutate(c)}
        onDelete={() => remove.mutate()}
        saved={save.isSuccess}
        scoreIsPublic={data.userRating.average != null}
      />
      <AffiliateBlock />
    </>
  );
}
