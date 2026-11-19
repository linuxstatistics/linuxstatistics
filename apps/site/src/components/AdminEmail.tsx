import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Metric, Section, When } from "./AdminParts";
import type { EmailStatusSummary } from "@linux-statistics/shared";

export interface Signup {
  id: number;
  email: string;
  source: string | null;
  createdAt: string;
  status?: "pending" | "confirmed" | "unsubscribed" | "legacy";
}

const STATUS_LABEL: Record<NonNullable<Signup["status"]>, string> = {
  pending: "Waiting to confirm",
  confirmed: "Confirmed",
  unsubscribed: "Unsubscribed",
  legacy: "Signed up before confirmation",
};

/** Newest first, filtered by a case-insensitive match on email, source page or status. */
export function filterSignups(rows: Signup[], query: string): Signup[] {
  const q = query.trim().toLowerCase();
  return [...rows]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .filter(
      (r) =>
        !q ||
        r.email.toLowerCase().includes(q) ||
        (r.source ?? "").toLowerCase().includes(q) ||
        (r.status ? STATUS_LABEL[r.status].toLowerCase().includes(q) : false),
    );
}

const TRACKING_KEY = "ls-admin-resend-tracking-off";

/** Reminder until the owner ticks it (stored in this browser only). */
function TrackingReminder() {
  const [done, setDone] = useState(true);
  useEffect(() => { setDone(localStorage.getItem(TRACKING_KEY) === "1"); }, []);
  if (done) return null;
  return (
    <p className="note" role="note">
      In Resend, turn open and click tracking off for linuxstatistics.com (Domains, then the domain's settings). Our privacy page promises no tracking.{" "}
      <button type="button" className="adm-btn" onClick={() => { localStorage.setItem(TRACKING_KEY, "1"); setDone(true); }}>Done, it's off</button>
    </p>
  );
}

function List({ rows, summary }: { rows: Signup[]; summary: EmailStatusSummary | undefined }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => filterSignups(rows, query), [rows, query]);
  const week = rows.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 7 * 86_400_000).length;
  const pages = new Set(rows.map((r) => r.source ?? "")).size;
  return (
    <div className="adm">
      <TrackingReminder />
      <dl className="adm-metrics">
        <Metric label="Confirmed" value={(summary?.counts.confirmed ?? 0).toLocaleString("en-US")} sub="get the monthly email" />
        <Metric label="Waiting to confirm" value={(summary?.counts.pending ?? 0).toLocaleString("en-US")} sub="deleted after 7 days" />
        <Metric
          label="Last 7 days"
          value={week.toLocaleString("en-US")}
          sub={summary && summary.lastWeek.signups ? `new signups, ${summary.lastWeek.confirmed} confirmed so far` : "new signups"}
        />
        <Metric label="Unsubscribed" value={(summary?.counts.unsubscribed ?? 0).toLocaleString("en-US")} sub="never mailed again" />
        {summary && summary.counts.legacy > 0 && (
          <Metric label="Before confirmation" value={summary.counts.legacy.toLocaleString("en-US")} sub="asked once, reminded at day 7, dropped at 30" />
        )}
        <Metric label="Signup pages" value={pages.toLocaleString("en-US")} sub="different pages" />
      </dl>
      <Section title="Signups" sub="Newest first">
        <div className="adm-filters">
          <label className="adm-field">
            <span>Search</span>
            <input type="search" placeholder="Email address, page or status" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <a className="adm-btn" href="/api/admin/email-signups.csv">Download CSV</a>
        </div>
        <p className="note" aria-live="polite">
          Showing <b>{shown.length}</b> of <b>{rows.length}</b>. The CSV lists confirmed addresses only, for Resend's contact import. Confirming already adds people to Resend, so the CSV is a backup.
        </p>
        {shown.length === 0 ? (
          <p className="adm-empty">{rows.length ? "No signups match that search." : "No signups yet. The form is in every page's footer."}</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table adm-stack">
              <thead><tr><th>Email</th><th>Status</th><th>Signed up</th><th>Page</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-wrap"><strong>{r.email}</strong></td>
                    <td className="adm-nowrap" data-label="Status">{r.status ? STATUS_LABEL[r.status] : "Unknown"}</td>
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
  const summary = useQuery({
    queryKey: ["admin-email-summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-summary", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as EmailStatusSummary;
    },
    enabled: me?.role === "admin",
  });
  return (
    <AdminGate>
      {q.isError ? <p className="error" role="alert">Couldn't load signups. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading signups" /> : <List rows={q.data} summary={summary.data} />}
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
