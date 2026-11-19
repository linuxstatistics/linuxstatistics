import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Metric, Section, When } from "./AdminParts";

export interface Signup {
  id: number;
  email: string;
  source: string | null;
  createdAt: string;
}

/** Newest first, filtered by a case-insensitive match on email or source page. */
export function filterSignups(rows: Signup[], query: string): Signup[] {
  const q = query.trim().toLowerCase();
  return [...rows]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .filter((r) => !q || r.email.toLowerCase().includes(q) || (r.source ?? "").toLowerCase().includes(q));
}

function List({ rows }: { rows: Signup[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => filterSignups(rows, query), [rows, query]);
  const week = rows.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 7 * 86_400_000).length;
  const pages = new Set(rows.map((r) => r.source ?? "")).size;
  return (
    <div className="adm">
      <dl className="adm-metrics">
        <Metric label="Signups" value={rows.length.toLocaleString("en-US")} sub="all time" />
        <Metric label="Last 7 days" value={week.toLocaleString("en-US")} sub="new signups" />
        <Metric label="Signup pages" value={pages.toLocaleString("en-US")} sub="different pages" />
      </dl>
      <Section title="Signups" sub="Newest first">
        <div className="adm-filters">
          <label className="adm-field">
            <span>Search</span>
            <input type="search" placeholder="Email address or page" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <a className="adm-btn" href="/api/admin/email-signups.csv">Download CSV</a>
        </div>
        <p className="note" aria-live="polite">
          Showing <b>{shown.length}</b> of <b>{rows.length}</b>. The CSV is for Resend's contact import; nothing is sent from here.
        </p>
        {shown.length === 0 ? (
          <p className="adm-empty">{rows.length ? "No signups match that search." : "No signups yet. The form is in every page's footer."}</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table adm-stack">
              <thead><tr><th>Email</th><th>Signed up</th><th>Page</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-wrap"><strong>{r.email}</strong></td>
                    <td className="adm-nowrap" data-label="Signed up"><When iso={r.createdAt} /></td>
                    <td className="adm-wrap" data-label="Page">{!r.source ? "Unknown" : /^\/[a-z0-9/_-]*$/i.test(r.source) ? <a href={r.source}>{r.source}</a> : r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

export function AdminEmailInner() {
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["admin-email"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-signups", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Signup[];
    },
    enabled: me?.role === "admin",
  });
  return (
    <AdminGate>
      {q.isError ? <p className="error" role="alert">Couldn't load signups. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading signups" /> : <List rows={q.data} />}
    </AdminGate>
  );
}

/** Island: email signups list for the admin. */
export function AdminEmail() {
  return (
    <Island>
      <AdminEmailInner />
    </Island>
  );
}
