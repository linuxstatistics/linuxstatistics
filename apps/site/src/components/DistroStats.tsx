import { RANK_SOURCE, RANK_VALUE_LABEL, type DistroDetail } from "@linux-statistics/shared";
import { FAMILY_LABELS, familyColor } from "../lib/families";
import { formatRating, ratingDetail } from "../lib/rating";
import { RankDifference } from "./RankDifference";

type Stat = [label: string, value: string, title?: string];

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const n = (v: number) => v.toLocaleString("en-US");

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

export type DetailRow = { label: string; value: string; href?: string; chip?: string; title?: string };

/**
 * Facts about the distro itself, leaving out anything unknown. "Other" family is
 * omitted: it only means "not in a family we track" and tells the reader nothing.
 */
export function detailRows(data: DistroDetail, baseName?: string | null, today?: string): DetailRow[] {
  const rows: DetailRow[] = [];
  if (data.status === "discontinued") rows.push({ label: "Status", value: "Discontinued" });
  if (data.family !== "other") {
    rows.push({ label: "Family", value: data.family === "independent" ? "Independent (not based on another distro)" : FAMILY_LABELS[data.family], chip: familyColor(data.family) });
  }
  if (data.basedOnSlug) rows.push({ label: "Based on", value: baseName ?? data.basedOnSlug, href: `/distro/${data.basedOnSlug}/` });
  if (data.firstReleaseYear != null) rows.push({ label: "First released", value: String(data.firstReleaseYear) });
  for (const [label, value, title] of releaseStats(data, today)) rows.push({ label, value, title });
  if (data.repoFullName) {
    const parts = [data.stars != null ? `${n(data.stars)} stars` : null, data.commitsLast30d != null ? `${n(data.commitsLast30d)} commits in 30 days` : null].filter(Boolean);
    rows.push({ label: "GitHub", value: parts.length ? parts.join(" · ") : data.repoFullName, href: `https://github.com/${data.repoFullName}` });
  }
  if (data.userRating.count > 0) rows.push({ label: "Community rating", value: formatRating(data.userRating), title: ratingDetail(data.userRating) });
  if (data.usesItCount > 0) rows.push({ label: "Users", value: `${n(data.usesItCount)} use it` });
  return rows;
}

/**
 * Two groups with a fixed shape: popularity (every listed distro has it, always three
 * cells) and details (only the facts we know). Static HTML, no client JS.
 */
export function DistroStats({ data, baseName }: { data: DistroDetail; baseName?: string | null }) {
  const details = detailRows(data, baseName);
  return (
    <div className="dstats">
      {data.rank != null && (
        <dl className="dstats-pop" aria-label="Popularity">
          <div>
            <dt>Rank</dt>
            <dd>#{data.rank}</dd>
          </div>
          <div>
            <dt>{RANK_VALUE_LABEL[RANK_SOURCE]}</dt>
            <dd>{data.hitsPerDay != null ? n(data.hitsPerDay) : "-"}</dd>
          </div>
          <div>
            <dt>Last month</dt>
            <dd className="dstats-move"><RankDifference value={data.rank1mDelta} /></dd>
          </div>
        </dl>
      )}
      {details.length > 0 && (
        <dl className="dstats-facts" aria-label="Details">
          {details.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd title={r.title}>
                {r.chip && <span className="family-chip" style={{ background: r.chip }} />}
                {r.href ? (
                  r.href.startsWith("http") ? (
                    <a href={r.href} target="_blank" aria-describedby="new-tab-description" title="Opens in a new tab" rel="noopener noreferrer">{r.value}</a>
                  ) : (
                    <a href={r.href}>{r.value}</a>
                  )
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {data.userRating.count > 0 && (
        <p className="rating-detail">
          {ratingDetail(data.userRating)}
          {data.userRating.mean != null ? ` · plain average ${data.userRating.mean.toFixed(1)}` : ""}
          {" · "}
          <a href="/about/ratings/">How scores work</a>
        </p>
      )}
    </div>
  );
}
