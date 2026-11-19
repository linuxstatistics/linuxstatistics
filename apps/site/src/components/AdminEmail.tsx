import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";

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
  return (
    <div className="adm">
      <div className="adm-filters">
        <input type="search" placeholder="Search email or page" aria-label="Search signups" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <p className="note">
        <b>{shown.length}</b> of <b>{rows.length}</b> {rows.length === 1 ? "signup" : "signups"} · <a href="/api/admin/email-signups.csv">Download CSV</a> (for Resend's contact import). Nothing is sent from here.
      </p>
      {shown.length === 0 ? (
        <p className="note">{rows.length ? "No signups match." : "No signups yet."}</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Email</th><th>Signed up</th><th>Page</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="adm-email">{r.email}</td>
                  <td className="adm-nowrap">{r.createdAt.slice(0, 10)}</td>
                  <td>{r.source ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
      {q.isError ? <p className="error">Couldn't load signups. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading signups" /> : <List rows={q.data} />}
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
