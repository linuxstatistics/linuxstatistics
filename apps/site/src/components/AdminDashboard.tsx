import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Metric, Section, Status, ago } from "./AdminParts";

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
  { key: "quizCompletions", label: "Quiz completions", href: "/admin/quiz/" },
  { key: "emailSignups", label: "Email signups", href: "/admin/email/" },
  { key: "switchReports", label: "Switch reports", href: "/admin/quiz/" },
  { key: "ratings", label: "New ratings", href: "/admin/ratings/" },
  { key: "affiliateClicks", label: "Affiliate clicks", href: "/admin/affiliates/" },
];

export function AdminDashboardInner() {
  const { data: me } = useMe();
  const q = useAdminSummary(me?.role === "admin");
  return (
    <AdminGate>
      {q.isError ? (
        <p className="error" role="alert">Couldn't load the summary. Try reloading.</p>
      ) : q.isLoading || !q.data ? (
        <CardsSkeleton label="Loading the summary" />
      ) : (
        <Dashboard s={q.data} />
      )}
    </AdminGate>
  );
}

function Dashboard({ s }: { s: AdminSummary }) {
  // Failing sources first, then late ones.
  const sources = s.sources.filter((x) => x.late || x.failing).sort((a, b) => Number(b.failing) - Number(a.failing));
  const votes = s.fitYes.last30 + s.fitNo.last30;
  const clear = s.openSuggestions === 0 && sources.length === 0;
  return (
    <div className="adm">
      <Section title="Needs attention">
        {clear ? (
          <p className="adm-allclear"><Status tone="ok">All clear</Status> No open suggestions, and every data source is on time.</p>
        ) : (
          <ul className="adm-attention">
            {sources.map((x) => (
              <li key={x.source}>
                <Status tone={x.failing ? "bad" : "warn"}>{x.failing ? "Failing" : "Late"}</Status>
                <a href={`/admin/sources/#${x.source}`}>{x.label}</a>
                <span className="adm-attn-detail">{x.lastSuccessAt ? `last good data ${ago(x.lastSuccessAt)}` : "no successful run yet"}</span>
                <span className="icon-arrow" aria-hidden="true" />
              </li>
            ))}
            {s.openSuggestions > 0 && (
              <li>
                <Status tone="info">To review</Status>
                <a href="/admin/suggestions/">{s.openSuggestions} open {s.openSuggestions === 1 ? "suggestion" : "suggestions"}</a>
                <span className="icon-arrow" aria-hidden="true" />
              </li>
            )}
          </ul>
        )}
      </Section>

      <Section title="Activity" sub="Last 7 days, with the 30-day total below">
        <dl className="adm-metrics">
          {CARDS.map((c) => (
            <Metric key={c.key} label={c.label} href={c.href} value={s[c.key].last7.toLocaleString("en-US")} sub={`${s[c.key].last30.toLocaleString("en-US")} in 30 days`} />
          ))}
          <Metric
            label={'Quiz "did it fit?"'}
            href="/admin/quiz/"
            value={votes ? `${Math.round((s.fitYes.last30 / votes) * 100)}%` : "No votes"}
            sub={votes ? `said yes, ${votes} ${votes === 1 ? "vote" : "votes"} in 30 days` : "in the last 30 days"}
          />
        </dl>
        <p className="note">Our own anonymous counts. Days are UTC; 7 days means today and the six before it.</p>
      </Section>
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
