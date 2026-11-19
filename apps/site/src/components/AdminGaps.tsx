import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Distro, Metric, Section, Status, When } from "./AdminParts";

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

const FIRST = 25;

function Report({ r }: { r: GapReport }) {
  const [field, setField] = useState("");
  const [all, setAll] = useState(false);
  const rows = useMemo(() => gapRows(r, field), [r, field]);
  const shown = all ? rows : rows.slice(0, FIRST);
  const count = (f: string) => r.rows.filter((x) => x.missing.includes(f)).length;
  return (
    <>
      <Section title="Missing data" sub={<>Report from <When iso={r.generatedAt} />, top {r.considered} ranked distros</>}>
        <dl className="adm-metrics">
          <Metric label="Distros with gaps" value={r.rows.length} sub={`of the top ${r.considered}`} />
          <Metric label="No profile or notes" value={r.newUnprofiled.length} sub="nothing curated yet" />
          <Metric label="Proposals" value={r.proposals.length} sub="from free sources" />
        </dl>
        <div className="adm-filters">
          <label className="adm-field is-narrow">
            <span>Missing</span>
            <select value={field} onChange={(e) => { setField(e.target.value); setAll(false); }}>
              <option value="">Anything ({r.rows.length})</option>
              {FIELDS.map((f) => <option key={f} value={f}>{LABEL[f]} ({count(f)})</option>)}
            </select>
          </label>
        </div>
        {rows.length === 0 ? <p className="adm-empty">No top-ranked distro is missing this.</p> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th className="num">Rank</th><th>Distro</th><th>Missing</th></tr></thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.slug}>
                    <td className="num">{x.rank}</td>
                    <td><Distro slug={x.slug} name={x.name} /></td>
                    <td><span className="adm-chips">{x.missing.map((m) => <span className="adm-chip" key={m}>{LABEL[m] ?? m}</span>)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > FIRST && (
          <button type="button" className="adm-btn adm-more" aria-expanded={all} onClick={() => setAll(!all)}>
            {all ? `Show the top ${FIRST}` : `Show all ${rows.length}`}
          </button>
        )}
      </Section>

      <Section title="Proposals to review" sub="Matched by name or link, not yet checked">
        {r.proposals.length === 0 ? <p className="adm-empty">No proposals this week.</p> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Distro</th><th>Source</th><th>Proposed value</th><th>Why it matched</th></tr></thead>
              <tbody>
                {r.proposals.map((p) => (
                  <tr key={p.slug + p.kind + p.value}>
                    <td><Distro slug={p.slug} name={r.rows.find((x) => x.slug === p.slug)?.name ?? p.slug} /></td>
                    <td><Status>{p.kind === "endoflife" ? "endoflife.date" : "Wikidata"}</Status></td>
                    <td className="adm-wrap"><code>{p.value}</code></td>
                    <td className="adm-wrap adm-muted">{p.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="note">Confirm each proposal on the project's own site before adding it to the curated data.</p>
      </Section>
    </>
  );
}

function Page({ g }: { g: Gaps }) {
  return (
    <div className="adm">
      <Section title="From visitors" sub="Open corrections and add-a-distro requests">
        {g.suggestions.length === 0 ? <p className="adm-empty">No open corrections or add-a-distro requests.</p> : (
          <ul className="adm-items">
            {g.suggestions.map((s) => (
              <li className="adm-item" key={s.id}>
                <div className="adm-item-head">
                  <Status tone={s.kind === "correction" ? "warn" : "info"}>{s.kind === "correction" ? "Correction" : "Add a distro"}</Status>
                  {s.subject && <span className="adm-item-title">{s.subject}</span>}
                  <span className="adm-item-when"><When iso={s.createdAt} relative /></span>
                </div>
                <p className="adm-item-body">{s.message}</p>
                <div className="adm-actions"><a className="adm-btn" href="/admin/suggestions/">Review in Suggestions</a></div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {g.report ? <Report r={g.report as GapReport} /> : <p className="adm-empty">No gap report yet. The Monday data job saves the first one.</p>}
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
      {q.isError ? <p className="error" role="alert">Couldn't load the gaps. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading the gaps" /> : <Page g={q.data} />}
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
