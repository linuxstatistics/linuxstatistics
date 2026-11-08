import { RANK_SOURCE, RANK_VALUE_LABEL, type DistroListItem } from "@linux-statistics/shared";
import { FAMILY_LABELS, familyColor } from "../lib/families";

function Move({ d }: { d: DistroListItem }) {
  const v = d.rank1mDelta;
  if (v == null || v === 0) return <span className="trend flat">=</span>;
  return v > 0 ? <span className="trend up">▲ {v}</span> : <span className="trend down">▼ {-v}</span>;
}

/** Top three distros as big cards; static HTML, no client JS. */
export function Podium({ items }: { items: DistroListItem[] }) {
  const top = items
    .filter((d): d is DistroListItem & { rank: number } => d.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);
  const max = Math.max(1, ...top.map((d) => d.hitsPerDay ?? 0));
  return (
    <div className="podium">
      {top.map((d) => (
        <a key={d.slug} className="pod" href={`/distro/${d.slug}/`}>
          <span className="pr">{d.rank}</span>
          <span className="pn">{d.name}</span>
          <span className="pm">
            <span className="fam" style={{ color: familyColor(d.family) }}>
              {FAMILY_LABELS[d.family].toLowerCase()}
            </span>
            <span title={RANK_VALUE_LABEL[RANK_SOURCE]}>
              {d.hitsPerDay?.toLocaleString("en-US") ?? "-"}
              <small> {RANK_VALUE_LABEL[RANK_SOURCE].toLowerCase()}</small>
            </span>
            <Move d={d} />
          </span>
          <i className="pb" style={{ width: `${(((d.hitsPerDay ?? 0) / max) * 100).toFixed(0)}%` }} />
        </a>
      ))}
    </div>
  );
}
