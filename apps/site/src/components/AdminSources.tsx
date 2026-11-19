import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { useAdminSummary, type SourceHealth } from "./AdminDashboard";
import { daysAgoText } from "../lib/freshness";

interface Run {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "failed";
  rowsWritten: number;
  error: string | null;
}

const every = (d: number) => (d === 1 ? "daily" : d === 7 ? "weekly" : "monthly");
const when = (iso: string | null) => (iso ? `${iso.slice(0, 16).replace("T", " ")} UTC (${daysAgoText((Date.now() - new Date(iso).getTime()) / 86_400_000)})` : "never");

function Runs({ source }: { source: string }) {
  const q = useQuery({
    queryKey: ["admin-runs", source],
    queryFn: async () => {
      const res = await fetch(`/api/admin/sources/${source}/runs`, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Run[];
    },
  });
  if (q.isError) return <p className="error">Couldn't load the runs.</p>;
  if (!q.data) return <p className="note">Loading runs…</p>;
  if (q.data.length === 0) return <p className="note">No runs recorded.</p>;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>Started (UTC)</th><th>Result</th><th className="num">Rows</th><th>Error</th></tr></thead>
        <tbody>
          {q.data.map((r) => (
            <tr key={r.id}>
              <td>{r.startedAt.slice(0, 16).replace("T", " ")}</td>
              <td><span className={`adm-status adm-${r.status}`}>{r.status}</span></td>
              <td className="num">{r.rowsWritten}</td>
              <td className="adm-err">{r.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceRow({ s }: { s: SourceHealth }) {
  const [open, setOpen] = useState(s.failing || s.late);
  const state = s.failing ? "failing" : s.late ? "late" : s.lastSuccessAt ? "ok" : "never ran";
  return (
    <section className="adm-source" id={s.source}>
      <h2>
        {s.label} <span className="adm-src-key">{s.source}</span>
        <span className={`adm-status adm-${state.replace(" ", "-")}`}>{state}</span>
      </h2>
      <dl className="adm-dl">
        <div><dt>Runs</dt><dd>{every(s.cadenceDays)}; late after {s.cadenceDays * 2} days without a good run</dd></div>
        <div><dt>Last success</dt><dd>{when(s.lastSuccessAt)}</dd></div>
        <div><dt>Last failure</dt><dd>{when(s.lastFailureAt)}</dd></div>
        {s.lastError && <div><dt>Last error</dt><dd className="adm-err">{s.lastError}</dd></div>}
      </dl>
      <button type="button" className="adm-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Hide" : "Show"} the last 20 runs
      </button>
      {open && <Runs source={s.source} />}
    </section>
  );
}

export function AdminSourcesInner() {
  const { data: me } = useMe();
  const q = useAdminSummary(me?.role === "admin");
  return (
    <AdminGate>
      {q.isError ? (
        <p className="error">Couldn't load source health. Try reloading.</p>
      ) : q.isLoading || !q.data ? (
        <CardsSkeleton label="Loading source health" />
      ) : (
        <div className="adm">
          {q.data.sources.map((s) => <SourceRow key={s.source} s={s} />)}
          <p className="note">Read-only. Runs start from the scheduled GitHub Actions job; a failed source keeps its last good data.</p>
        </div>
      )}
    </AdminGate>
  );
}

/** Island: per-source ingestion health for the admin. */
export function AdminSources() {
  return (
    <Island>
      <AdminSourcesInner />
    </Island>
  );
}
