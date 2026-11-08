import { useQuery } from "@tanstack/react-query";
import { AFFILIATE_PARTNERS } from "@linux-statistics/shared";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";

interface Row {
  partner: string;
  last7: number;
  last30: number;
  allTime: number;
}

const NAME = Object.fromEntries(AFFILIATE_PARTNERS.map((p) => [p.slug, p.name]));

export function AdminAffiliateClicksInner() {
  const { data: me, isLoading: meLoading } = useMe();
  const isAdmin = me?.role === "admin";
  const q = useQuery({
    queryKey: ["admin-affiliate-clicks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/affiliate-clicks", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Row[];
    },
    enabled: isAdmin,
  });

  if (meLoading) return <CardsSkeleton label="Checking your account" />;
  if (!me) return <p className="adm-gate">Sign in with an admin account to see this page.</p>;
  if (!isAdmin) return <p className="adm-gate">Your account isn't an admin. Ask the site owner to add it to ADMIN_USERS.</p>;
  if (q.isError) return <p className="error">Couldn't load click counts. Try reloading.</p>;
  if (q.isLoading || !q.data) return <CardsSkeleton label="Loading click counts" />;
  // Show every configured partner, even with zero clicks so far.
  const bySlug = new Map(q.data.map((r) => [r.partner, r]));
  const rows = AFFILIATE_PARTNERS.map((p) => bySlug.get(p.slug) ?? { partner: p.slug, last7: 0, last30: 0, allTime: 0 });

  return (
    <div className="adm">
      <table className="data-table">
        <thead>
          <tr>
            <th>Partner</th>
            <th className="num">Last 7 days</th>
            <th className="num">Last 30 days</th>
            <th className="num">All time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.partner}>
              <td>{NAME[r.partner] ?? r.partner}</td>
              <td className="num">{r.last7}</td>
              <td className="num">{r.last30}</td>
              <td className="num">{r.allTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">Counts are per partner per UTC day. Crawlers and link previews are not counted. Nothing about the visitor is stored.</p>
    </div>
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
