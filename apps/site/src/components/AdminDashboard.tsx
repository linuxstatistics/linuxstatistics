import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { daysAgoText } from "../lib/freshness";

interface WindowCounts { last7: number; last30: number }
export interface SourceHealth {
  source: string;
  label: string;
  cadenceDays: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  late: boolean;
  failing: boolean;
}
export interface AdminSummary {
  emailSignups: WindowCounts;
  quizCompletions: WindowCounts;
  fitYes: WindowCounts;
  fitNo: WindowCounts;
  switchReports: WindowCounts;
  ratings: WindowCounts;
  affiliateClicks: WindowCounts;
  openSuggestions: number;
  sources: SourceHealth[];
}

export function useAdminSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/summary", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as AdminSummary;
    },
    enabled,
  });
}

const CARDS: { key: keyof Omit<AdminSummary, "openSuggestions" | "sources">; label: string; href?: string }[] = [
  { key: "emailSignups", label: "Email signups", href: "/api/admin/email-signups.csv" },
  { key: "quizCompletions", label: "Quiz completions", href: "/api/admin/quiz-completions.csv" },
  { key: "switchReports", label: "Switch reports", href: "/api/admin/switch-reports.csv" },
  { key: "ratings", label: "New ratings" },
  { key: "affiliateClicks", label: "Affiliate clicks", href: "/admin/affiliates/" },
];

const ago = (iso: string) => daysAgoText((Date.now() - new Date(iso).getTime()) / 86_400_000);

export function AdminDashboardInner() {
  const { data: me } = useMe();
  const q = useAdminSummary(me?.role === "admin");
  return (
    <AdminGate>
      {q.isError ? (
        <p className="error">Couldn't load the summary. Try reloading.</p>
      ) : q.isLoading || !q.data ? (
        <CardsSkeleton label="Loading the summary" />
      ) : (
        <Dashboard s={q.data} />
      )}
    </AdminGate>
  );
}

function Dashboard({ s }: { s: AdminSummary }) {
  const attention = s.sources.filter((x) => x.late || x.failing);
  const votes = s.fitYes.last30 + s.fitNo.last30;
  return (
    <div className="adm">
      <h2>Needs attention</h2>
      {s.openSuggestions === 0 && attention.length === 0 ? (
        <p className="note">Nothing waiting: no open suggestions, every source on time.</p>
      ) : (
        <ul className="adm-attention">
          {s.openSuggestions > 0 && (
            <li><a href="/admin/suggestions/">{s.openSuggestions} open {s.openSuggestions === 1 ? "suggestion" : "suggestions"}</a></li>
          )}
          {attention.map((x) => (
            <li key={x.source}>
              <a href={`/admin/sources/#${x.source}`}>{x.label}</a>: {x.failing ? "last run failed" : "late"}
              {x.lastSuccessAt ? `, last good data ${ago(x.lastSuccessAt)}` : ""}
            </li>
          ))}
        </ul>
      )}

      <h2>Last 7 and 30 days</h2>
      <div className="adm-cards">
        {CARDS.map((c) => (
          <div className="adm-card" key={c.key}>
            <span className="adm-card-lbl">{c.href ? <a href={c.href}>{c.label}</a> : c.label}</span>
            <span className="adm-card-big">{s[c.key].last7}</span>
            <span className="adm-card-sub">{s[c.key].last30} in 30 days</span>
          </div>
        ))}
        <div className="adm-card">
          <span className="adm-card-lbl">Quiz "did it fit?"</span>
          <span className="adm-card-big">{votes ? `${Math.round((s.fitYes.last30 / votes) * 100)}%` : "–"}</span>
          <span className="adm-card-sub">yes, {votes} {votes === 1 ? "vote" : "votes"} in 30 days</span>
        </div>
      </div>
      <p className="note">Days are UTC; "7 days" is today and the six before it. Our own anonymous counts only.</p>
    </div>
  );
}

/** Island: admin dashboard. */
export function AdminDashboard() {
  return (
    <Island>
      <AdminDashboardInner />
    </Island>
  );
}
