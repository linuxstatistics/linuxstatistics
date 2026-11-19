import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";

/** Same keys and wording as the worker's gap report (apps/worker/src/gaps.ts). */
export const LABEL: Record<string, string> = {
  profile: "quiz profile or reference card",
  notes: "pros and cons",
  telemetry: "telemetry check",
  summary: "summary",
  releaseYear: "first release year",
  homepage: "homepage",
  repo: "GitHub repo",
  releases: "release dates",
};
const FIELDS = Object.keys(LABEL);

export interface GapReport {
  generatedAt: string;
  considered: number;
  rows: { slug: string; name: string; rank: number; missing: string[] }[];
  newUnprofiled: string[];
  proposals: { slug: string; kind: string; value: string; why: string }[];
}
interface Gaps {
  report: GapReport | null;
  suggestions: { id: number; kind: string; subject: string | null; message: string; createdAt: string }[];
}

/** Rows missing `field` (all rows when empty), highest-ranked first. */
export function gapRows(r: GapReport, field: string): GapReport["rows"] {
  return [...r.rows].filter((x) => !field || x.missing.includes(field)).sort((a, b) => a.rank - b.rank);
}

function Report({ r }: { r: GapReport }) {
  const [field, setField] = useState("");
  const rows = useMemo(() => gapRows(r, field), [r, field]);
  const count = (f: string) => r.rows.filter((x) => x.missing.includes(f)).length;
  return (
    <>
      <p className="note">
        Report from <b>{r.generatedAt.slice(0, 10)}</b> covering the top <b>{r.considered}</b> ranked distros. It runs every Monday; nothing here edits data.
      </p>
      <div className="adm-filters">
        <select aria-label="Missing" value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">Anything missing ({r.rows.length})</option>
          {FIELDS.map((f) => <option key={f} value={f}>{LABEL[f]} ({count(f)})</option>)}
        </select>
      </div>
      {rows.length === 0 ? <p className="note">Nothing missing here.</p> : (
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th className="num">Rank</th><th>Distro</th><th>Missing</th></tr></thead>
          <tbody>
            {rows.slice(0, 100).map((x) => (
              <tr key={x.slug}>
                <td className="num">{x.rank}</td>
                <td><a href={`/distro/${x.slug}/`}>{x.name}</a></td>
                <td>{x.missing.map((m) => LABEL[m] ?? m).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {rows.length > 100 && <p className="note">Showing the 100 highest-ranked of {rows.length}.</p>}

      <h2>Proposals to review</h2>
      {r.proposals.length === 0 ? <p className="note">No proposals this week.</p> : (
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>Distro</th><th>Source</th><th>Proposed</th><th>Why</th></tr></thead>
          <tbody>
            {r.proposals.map((p) => (
              <tr key={p.slug + p.kind + p.value}>
                <td><a href={`/distro/${p.slug}/`}>{p.slug}</a></td>
                <td>{p.kind === "endoflife" ? "endoflife.date" : "Wikidata (GitHub)"}</td>
                <td><code>{p.value}</code></td>
                <td>{p.why}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <p className="note">Proposals are matches by name or link, not checked facts. Confirm each against the project's own site before adding it.</p>
    </>
  );
}

function Page({ g }: { g: Gaps }) {
  return (
    <div className="adm">
      <h2>From visitors</h2>
      {g.suggestions.length === 0 ? <p className="note">No open corrections or "add a distro" requests.</p> : (
        <ul className="adm-attention">
          {g.suggestions.map((s) => (
            <li key={s.id}>
              <b>{s.kind === "correction" ? "Correction" : "Add a distro"}</b>{s.subject ? ` (${s.subject})` : ""}: {s.message.length > 160 ? `${s.message.slice(0, 160)}…` : s.message}{" "}
              <a href="/admin/suggestions/">Review</a>
            </li>
          ))}
        </ul>
      )}
      <h2>Missing data</h2>
      {g.report ? <Report r={g.report as GapReport} /> : <p className="note">No report yet. The first one is saved by the Monday run.</p>}
    </div>
  );
}

export function AdminGapsInner() {
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["admin-gaps"],
    queryFn: async () => {
      const res = await fetch("/api/admin/gaps", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Gaps;
    },
    enabled: me?.role === "admin",
  });
  return (
    <AdminGate>
      {q.isError ? <p className="error">Couldn't load the gaps. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading the gaps" /> : <Page g={q.data} />}
    </AdminGate>
  );
}

/** Island: data gaps and visitor corrections for the admin. */
export function AdminGaps() {
  return (
    <Island>
      <AdminGapsInner />
    </Island>
  );
}
