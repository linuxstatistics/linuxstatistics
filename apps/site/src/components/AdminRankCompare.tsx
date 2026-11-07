import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";

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

const LABEL: Record<string, string> = { distrowatch: "Current rank", interest: "Our index" };
const label = (s: string) => LABEL[s] ?? s;
const num = (n: number | null) => (n == null ? "–" : `#${n}`);

function Table({ title, rows, a, b }: { title: string; rows: Row[]; a: string; b: string }) {
  return (
    <section className="dsec">
      <h2>{title}</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Distro</th>
            <th>{label(b)}</th>
            <th>{label(a)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug}>
              <td>
                <a href={`/distro/${r.slug}/`}>{r.name}</a>
              </td>
              <td>{num(r.b)}</td>
              <td>{num(r.a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function AdminRankCompareInner() {
  const { data: me, isLoading: meLoading } = useMe();
  const isAdmin = me?.role === "admin";
  const q = useQuery({
    queryKey: ["admin-rank-compare"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rank-compare", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as RankCompare;
    },
    enabled: isAdmin,
  });

  if (meLoading) return <CardsSkeleton label="Checking your account" />;
  if (!me) return <p className="adm-gate">Sign in with an admin account to see this page.</p>;
  if (!isAdmin) return <p className="adm-gate">Your account isn't an admin. Ask the site owner to add it to ADMIN_USERS.</p>;
  if (q.isError) return <p className="error">Couldn't load the comparison. Try reloading.</p>;
  if (q.isLoading || !q.data) return <CardsSkeleton label="Loading the comparison" />;
  const c = q.data;
  if (!c.capturedB) return <p className="adm-empty">Our index hasn't been built yet. Run the wikipedia ingest.</p>;

  return (
    <div className="adm">
      <dl className="stats">
        <div><dt>Ranked by both</dt><dd>{c.both}</dd></div>
        <div><dt>Only {label(c.a).toLowerCase()}</dt><dd>{c.onlyA}</dd></div>
        <div><dt>Only {label(c.b).toLowerCase()}</dt><dd>{c.onlyB}</dd></div>
        <div><dt>Rank correlation</dt><dd>{c.spearman ?? "–"}</dd></div>
        <div><dt>Top-25 overlap</dt><dd>{c.top25Overlap} / 25</dd></div>
      </dl>
      <p className="note">
        {label(c.b)} captured {c.capturedB}; {label(c.a).toLowerCase()} captured {c.capturedA ?? "never"}. Correlation is Spearman's, over distros
        ranked by both (1 = same order).
      </p>
      <Table title={`${label(c.b)}: top 50`} rows={c.topB} a={c.a} b={c.b} />
      <Table title="Biggest disagreements" rows={c.biggestGaps} a={c.a} b={c.b} />
    </div>
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
