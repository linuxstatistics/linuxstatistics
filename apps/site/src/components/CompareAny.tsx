import { useEffect, useState } from "react";
import { RANK_SOURCE, RANK_VALUE_LABEL, type DistroDetail } from "@linux-statistics/shared";
import { FAMILY_LABELS } from "../lib/families";
import { CompareSkeleton } from "./Skeleton";
import { PairVerdict } from "./PairVerdict";
import { ProsConsPair } from "./ProsCons";
import { pairVerdict } from "../lib/verdict";
import { notesFor } from "../lib/distro-notes";

const num = (v: number | null) => (v == null ? "-" : v.toLocaleString("en-US"));

/**
 * Client-rendered comparison for pairs without a static page (reads ?a=&b=).
 * Not indexed: the page carries noindex via its parent, and popular pairs
 * have their own static pages.
 */
export function CompareAny({ names = {} }: { names?: Record<string, string> }) {
  const [pair, setPair] = useState<[DistroDetail, DistroDetail] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wanted, setWanted] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const a = p.get("a");
    const b = p.get("b");
    if (!a || !b) return;
    setWanted(true);
    Promise.all(
      [a, b].map(async (s) => {
        const res = await fetch(`/api/distros/${encodeURIComponent(s)}`);
        if (!res.ok) throw new Error(`Unknown distro "${s}"`);
        return (await res.json()) as DistroDetail;
      }),
    )
      .then(([x, y]) => setPair([x!, y!]))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (!wanted) return null;
  if (error) return <p className="error">{error}</p>;
  if (!pair) return <CompareSkeleton />;
  const [a, b] = pair;
  const base = (s: string | null) => (s ? (names[s] ?? s) : "-");
  const all: [string, string, string][] = [
    ["Popularity rank (12 months)", num(a.rank), num(b.rank)],
    ["Rank last month", num(a.rank1m), num(b.rank1m)],
    [RANK_VALUE_LABEL[RANK_SOURCE], num(a.hitsPerDay), num(b.hitsPerDay)],
    ["Family", FAMILY_LABELS[a.family], FAMILY_LABELS[b.family]],
    ["Based on", base(a.basedOnSlug), base(b.basedOnSlug)],
    ["First released", a.firstReleaseYear?.toString() ?? "-", b.firstReleaseYear?.toString() ?? "-"],
    ["GitHub stars", num(a.stars), num(b.stars)],
    ["Commits, last 30 days", num(a.commitsLast30d), num(b.commitsLast30d)],
  ];
  const rows = all.filter(([, x, y]) => x !== "-" || y !== "-");
  const nameMap = new Map(Object.entries(names));
  const verdict = pairVerdict(a, b, nameMap) ?? {
    a: { name: a.name, reasons: [], empty: "unknown" as const },
    b: { name: b.name, reasons: [], empty: "unknown" as const },
  };
  const thin = [a, b].filter(
    (d) => [d.firstReleaseYear, d.stars, d.commitsLast30d, d.basedOnSlug, notesFor(d.slug), d.userRating.count || null].filter((v) => v != null).length <= 1,
  );
  return (
    <section aria-label="Comparison">
      <h2>
        {a.name} vs {b.name}
      </h2>
      <PairVerdict v={verdict} />
      {thin.length > 0 && (
        <p className="no-data-note" role="note">
          <span className="no-data-label">Limited data</span>
          {thin.map((d) => d.name).join(" and ")} {thin.length > 1 ? "have" : "has"} little data beyond popularity, so some rows below are empty.{" "}
          <a href="/suggest/?kind=correction">Help fill it in</a>.
        </p>
      )}
      <div className="table-scroll">
        <table className="data-table compare-table">
          <thead>
            <tr>
              <th />
              {[a, b].map((d) => (
                <th key={d.slug}>
                  <a href={`/distro/${d.slug}/`}>{d.name}</a>
                  <span className="th-sub">
                    {d.rank != null ? `#${d.rank} · ` : ""}
                    {FAMILY_LABELS[d.family]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, x, y]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{x}</td>
                <td>{y}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProsConsPair a={{ name: a.name, notes: notesFor(a.slug) }} b={{ name: b.name, notes: notesFor(b.slug) }} />
    </section>
  );
}
