import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Distro, Metric, Section } from "./AdminParts";

interface Row {
  slug: string;
  name: string;
  a: number | null;
  b: number | null;
}

export interface RankCompare {
  a: string;
  b: string;
  capturedA: string | null;
  capturedB: string | null;
  both: number;
  onlyA: number;
  onlyB: number;
  spearman: number | null;
  top25Overlap: number;
  biggestGaps: Row[];
  topB: Row[];
}

const LABEL: Record<string, string> = { distrowatch: "DistroWatch rank", interest: "Wikipedia interest", composite: "Our composite index" };
const label = (s: string) => LABEL[s] ?? s;
const num = (n: number | null) => (n == null ? "n/a" : `#${n}`);

function Table({ title, sub, rows, a, b }: { title: string; sub?: string; rows: Row[]; a: string; b: string }) {
  return (
    <Section title={title} sub={sub}>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Distro</th>
              <th className="num">{label(b)}</th>
              <th className="num">{label(a)}</th>
              <th className="num">Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td><Distro slug={r.slug} name={r.name} /></td>
                <td className="num">{num(r.b)}</td>
                <td className="num">{num(r.a)}</td>
                <td className="num adm-muted">{r.a != null && r.b != null ? Math.abs(r.a - r.b) : "n/a"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function AdminRankCompareInner() {
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin";
  const [b, setB] = useState<"composite" | "interest">("composite");
  const q = useQuery({
    queryKey: ["admin-rank-compare", b],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rank-compare?b=${b}`, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as RankCompare;
    },
    enabled: isAdmin,
  });

  const picker = (
    <div className="adm-filters">
      <span className="seg" role="group" aria-label="Compare against">
        {(["composite", "interest"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={b === k} onClick={() => setB(k)}>
            {label(k)}
          </button>
        ))}
      </span>
    </div>
  );
  const c = q.data;
  return (
    <AdminGate>
      <div className="adm">
        {picker}
        {q.isError ? (
          <p className="error" role="alert">Couldn't load the comparison. Try reloading.</p>
        ) : q.isLoading || !c ? (
          <CardsSkeleton label="Loading the comparison" />
        ) : !c.capturedB ? (
          <p className="adm-empty">{label(b)} hasn't been built yet. Run the wikipedia ingest.</p>
        ) : (
          <>
            <dl className="adm-metrics">
              <Metric label="Rank correlation" value={c.spearman ?? "n/a"} sub="Spearman, 1 = same order" />
              <Metric label="Top-25 overlap" value={`${c.top25Overlap} / 25`} sub="distros in both top 25s" />
              <Metric label="Ranked by both" value={c.both} sub={`${c.onlyA} only in ${label(c.a).toLowerCase()}, ${c.onlyB} only in ${label(c.b).toLowerCase()}`} />
            </dl>
            <p className="note">
              {label(c.b)} captured {c.capturedB}; {label(c.a).toLowerCase()} captured {c.capturedA ?? "never"}.
            </p>
            <Table title="Biggest disagreements" sub="Largest rank gaps first" rows={c.biggestGaps} a={c.a} b={c.b} />
            <Table title={`${label(c.b)}: top 50`} rows={c.topB} a={c.a} b={c.b} />
          </>
        )}
      </div>
    </AdminGate>
  );
}

/** Island: the shadow-period rank comparison. */
export function AdminRankCompare() {
  return (
    <Island>
      <AdminRankCompareInner />
    </Island>
  );
}
