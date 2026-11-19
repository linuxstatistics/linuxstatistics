import { Fragment, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { useAdminSummary, type SourceHealth } from "./AdminDashboard";
import { Section, Status, When, dateTime, type Tone } from "./AdminParts";

interface Run {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "failed";
  rowsWritten: number;
  error: string | null;
}

const every = (d: number) => (d === 1 ? "Daily" : d === 7 ? "Weekly" : "Monthly");

/** State word, tone and sort weight (worst first). */
export function sourceState(s: SourceHealth): { label: string; tone: Tone; weight: number } {
  if (s.failing) return { label: "Failing", tone: "bad", weight: 0 };
  if (s.late) return { label: "Late", tone: "warn", weight: 1 };
  if (!s.lastSuccessAt) return { label: "Never ran", tone: "neutral", weight: 2 };
  return { label: "OK", tone: "ok", weight: 3 };
}

const RUN_TONE: Record<Run["status"], Tone> = { success: "ok", failed: "bad", running: "info" };
const RUN_LABEL: Record<Run["status"], string> = { success: "Success", failed: "Failed", running: "Running" };

function Runs({ source }: { source: string }) {
  const q = useQuery({
    queryKey: ["admin-runs", source],
    queryFn: async () => {
      const res = await fetch(`/api/admin/sources/${source}/runs`, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Run[];
    },
  });
  if (q.isError) return <p className="error" role="alert">Couldn't load the runs.</p>;
  if (!q.data) return <p className="note" aria-busy="true">Loading runs…</p>;
  if (q.data.length === 0) return <p className="note">No runs recorded yet.</p>;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="visually-hidden">Last {q.data.length} runs</caption>
        <thead><tr><th>Started</th><th>Result</th><th className="num">Rows</th><th>Error</th></tr></thead>
        <tbody>
          {q.data.map((r) => (
            <tr key={r.id}>
              <td className="adm-nowrap">{dateTime(r.startedAt)}</td>
              <td><Status tone={RUN_TONE[r.status]}>{RUN_LABEL[r.status]}</Status></td>
              <td className="num">{r.rowsWritten.toLocaleString("en-US")}</td>
              <td className="adm-wrap adm-err">{r.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourcesTable({ sources }: { sources: SourceHealth[] }) {
  const rows = [...sources].sort((a, b) => sourceState(a).weight - sourceState(b).weight);
  // Open the row a dashboard link points at (#source), and any failing source.
  const [open, setOpen] = useState<Set<string>>(() => new Set(rows.filter((s) => s.failing).map((s) => s.source)));
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && rows.some((s) => s.source === id)) {
      setOpen((o) => new Set(o).add(id));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
    }
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggle = (k: string) => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <div className="table-scroll adm-sources-wrap">
      <table className="data-table adm-sources">
        <thead>
          <tr><th>Source</th><th>State</th><th>Runs</th><th>Last success</th><th>Last failure</th><th><span className="visually-hidden">History</span></th></tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const st = sourceState(s);
            const isOpen = open.has(s.source);
            return (
              <Fragment key={s.source}>
                <tr id={s.source}>
                  <td>
                    <span className="adm-src-name"><strong>{s.label}</strong><span className="adm-src-key">{s.source}</span></span>
                  </td>
                  <td className="adm-src-state"><Status tone={st.tone}>{st.label}</Status></td>
                  <td className="adm-nowrap adm-muted" data-label="Runs">{every(s.cadenceDays)}</td>
                  <td className="adm-nowrap" data-label="Last success">{s.lastSuccessAt ? <><When iso={s.lastSuccessAt} relative /></> : <span className="adm-muted">Never</span>}</td>
                  <td className="adm-wrap" data-label="Last failure">
                    {s.lastFailureAt ? (
                      <>
                        <When iso={s.lastFailureAt} relative />
                        {s.lastError && <span className="adm-err-line">{s.lastError}</span>}
                      </>
                    ) : (
                      <span className="adm-muted">None</span>
                    )}
                  </td>
                  <td className="num adm-src-act">
                    <button type="button" className="adm-btn subtle" aria-expanded={isOpen} aria-controls={`runs-${s.source}`} onClick={() => toggle(s.source)}>
                      {isOpen ? "Hide runs" : "Runs"}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="adm-runs-row" id={`runs-${s.source}`}>
                    <td colSpan={6}><Runs source={s.source} /></td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminSourcesInner() {
  const { data: me } = useMe();
  const q = useAdminSummary(me?.role === "admin");
  return (
    <AdminGate>
      {q.isError ? (
        <p className="error" role="alert">Couldn't load source health. Try reloading.</p>
      ) : q.isLoading || !q.data ? (
        <CardsSkeleton label="Loading source health" />
      ) : (
        <div className="adm">
          <Section title="Sources" sub={`${q.data.sources.filter((s) => s.failing || s.late).length} need attention`}>
            <SourcesTable sources={q.data.sources} />
            <p className="note">
              A source is late after twice its cadence without a good run. Runs start from the scheduled GitHub Actions job; a failed source keeps
              its last good data.
            </p>
          </Section>
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
