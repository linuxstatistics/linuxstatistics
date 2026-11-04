import { useEffect, useState } from "react";
import type { DistroDetail } from "@linux-statistics/shared";
import { FAMILY_LABELS } from "../lib/families";

const num = (v: number | null) => (v == null ? "—" : v.toLocaleString("en-US"));

/**
 * Client-rendered comparison for pairs without a static page (reads ?a=&b=).
 * Not indexed: the page carries noindex via its parent, and popular pairs
 * have their own static pages.
 */
export function CompareAny() {
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
  if (!pair) return <p className="loading">Loading comparison…</p>;
  const [a, b] = pair;
  const rows: [string, string, string][] = [
    ["DistroWatch rank (12 months)", num(a.rank), num(b.rank)],
    ["Rank last month", num(a.rank1m), num(b.rank1m)],
    ["Hits per day", num(a.hitsPerDay), num(b.hitsPerDay)],
    ["Family", FAMILY_LABELS[a.family], FAMILY_LABELS[b.family]],
    ["Based on", a.basedOnSlug ?? "—", b.basedOnSlug ?? "—"],
    ["First released", a.firstReleaseYear?.toString() ?? "—", b.firstReleaseYear?.toString() ?? "—"],
    ["GitHub stars", num(a.stars), num(b.stars)],
    ["Commits, last 30 days", num(a.commitsLast30d), num(b.commitsLast30d)],
  ];
  return (
    <section aria-label="Comparison">
      <h2>
        {a.name} vs {b.name}
      </h2>
      <div className="table-scroll">
        <table className="data-table compare-table">
          <thead>
            <tr>
              <th />
              <th>
                <a href={`/distro/${a.slug}/`}>{a.name}</a>
              </th>
              <th>
                <a href={`/distro/${b.slug}/`}>{b.name}</a>
              </th>
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
    </section>
  );
}
