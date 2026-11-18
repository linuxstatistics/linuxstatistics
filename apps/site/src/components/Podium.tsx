import { RANK_SOURCE, RANK_VALUE_LABEL, type DistroListItem } from "@linux-statistics/shared";
import { FAMILY_LABELS } from "../lib/families";
import { topRanked } from "../lib/headline";
import { RankDifference } from "./RankDifference";

/**
 * Top three distros as big cards; static HTML, no client JS. An ordered list with
 * spaces between the parts, so screen readers and text extraction read
 * "1 Arch arch family 952 interest score" rather than "1Archarch952".
 */
export function Podium({ items }: { items: DistroListItem[] }) {
  const top = topRanked(items, 3);
  const max = Math.max(1, ...top.map((d) => d.hitsPerDay ?? 0));
  const valueLabel = RANK_VALUE_LABEL[RANK_SOURCE].toLowerCase();
  return (
    <ol className="podium" role="list" aria-label="Top 3 distros">
      {top.map((d) => (
        <li key={d.slug} className="pod-item">
          <a className="pod" href={`/distro/${d.slug}/`}>
            <span className="pr"><span className="visually-hidden">Rank </span>{d.rank}</span>{" "}
            <span className="pt">
              <span className="pn">{d.name}</span>{" "}
              <span className="pm">
                <span className="fam">{FAMILY_LABELS[d.family].toLowerCase()}<span className="visually-hidden"> family</span></span>{" "}
                <span title={RANK_VALUE_LABEL[RANK_SOURCE]}>
                  {d.hitsPerDay?.toLocaleString("en-US") ?? "-"}
                  <small> {valueLabel}</small>
                </span>{" "}
                <RankDifference value={d.rank1mDelta} />
              </span>
            </span>
            <i className="pb" aria-hidden="true" style={{ width: `${(((d.hitsPerDay ?? 0) / max) * 100).toFixed(0)}%` }} />
          </a>
        </li>
      ))}
    </ol>
  );
}
