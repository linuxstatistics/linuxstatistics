import { useQuery } from "@tanstack/react-query";
import { AFFILIATE_PARTNERS } from "@linux-statistics/shared";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Metric, Section } from "./AdminParts";

interface Row {
  partner: string;
  last7: number;
  last30: number;
  allTime: number;
}

const NAME = Object.fromEntries(AFFILIATE_PARTNERS.map((p) => [p.slug, p.name]));

export function AdminAffiliateClicksInner() {
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["admin-affiliate-clicks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/affiliate-clicks", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Row[];
    },
    enabled: me?.role === "admin",
  });
  // Show every configured partner, even with zero clicks so far.
  const bySlug = new Map((q.data ?? []).map((r) => [r.partner, r]));
  const rows = AFFILIATE_PARTNERS.map((p) => bySlug.get(p.slug) ?? { partner: p.slug, last7: 0, last30: 0, allTime: 0 });
  const sum = (k: "last7" | "last30" | "allTime") => rows.reduce((a, r) => a + r[k], 0);
  return (
    <AdminGate>
      {q.isError ? (
        <p className="error" role="alert">Couldn't load click counts. Try reloading.</p>
      ) : q.isLoading || !q.data ? (
        <CardsSkeleton label="Loading click counts" />
      ) : (
        <div className="adm">
          <dl className="adm-metrics">
            <Metric label="Last 7 days" value={sum("last7")} sub="clicks, all partners" />
            <Metric label="Last 30 days" value={sum("last30")} sub="clicks, all partners" />
            <Metric label="All time" value={sum("allTime")} sub="clicks, all partners" />
          </dl>
          <Section title="By partner">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Partner</th><th className="num">Last 7 days</th><th className="num">Last 30 days</th><th className="num">All time</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.partner}>
                      <td><strong>{NAME[r.partner] ?? r.partner}</strong></td>
                      <td className="num">{r.last7}</td>
                      <td className="num">{r.last30}</td>
                      <td className="num">{r.allTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">Counted per partner per UTC day by the redirect. Crawlers and link previews aren't counted, and nothing about the visitor is stored.</p>
          </Section>
        </div>
      )}
    </AdminGate>
  );
}

/** Island: affiliate click totals for the admin. */
export function AdminAffiliateClicks() {
  return (
    <Island>
      <AdminAffiliateClicksInner />
    </Island>
  );
}
