import type { DistroListItem, MarketSharePoint, Meta } from "@linux-statistics/shared";

export interface MonthlySummary {
  month: string; // "November 2026"
  capturedAt: string; // YYYY-MM-DD
  top10: { rank: number; name: string; slug: string; hitsPerDay: number | null }[];
  rising: { name: string; slug: string; rank: number; rank1m: number; climb: number }[];
  falling: { name: string; slug: string; rank: number; rank1m: number; drop: number }[];
  linuxShare: { month: string; pct: number; changePts: number | null } | null;
  totalTracked: number;
}

/** The month's date: when the composite index was last rebuilt (by the wikipedia ingest). Same rule for the email and the site's card. */
export function summaryDate(meta: Meta, now: Date = new Date()): Date {
  const idx = meta.sources.find((s) => s.source === "wikipedia");
  return idx?.lastSuccessAt ? new Date(idx.lastSuccessAt) : now;
}

/** Path of the month's share card on the site, e.g. "/monthly/2026-11.png". */
export const cardPath = (s: MonthlySummary) => `/monthly/${s.capturedAt.slice(0, 7)}.png`;

const monthName = (d: Date) => d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Pure: turn API data into the month's summary. */
export function buildSummary(
  list: DistroListItem[],
  rising: DistroListItem[],
  share: MarketSharePoint[],
  capturedAt: Date,
): MonthlySummary {
  const ranked = list
    .filter((d): d is DistroListItem & { rank: number } => d.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  const falling = ranked
    .filter((d) => d.rank <= 100 && d.rank1m !== null && (d.rank1mDelta ?? 0) < 0)
    .sort((a, b) => (a.rank1mDelta ?? 0) - (b.rank1mDelta ?? 0))
    .slice(0, 5);
  const linux = share
    .filter((p) => p.platform === "linux")
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const last = linux[linux.length - 1];
  const prev = linux[linux.length - 2];
  // Only compare consecutive months (seed data has yearly points).
  const monthsApart = (a: string, b: string) => {
    const x = new Date(a), y = new Date(b);
    return (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + y.getUTCMonth() - x.getUTCMonth();
  };
  return {
    month: monthName(capturedAt),
    capturedAt: capturedAt.toISOString().slice(0, 10),
    top10: ranked.slice(0, 10).map((d) => ({ rank: d.rank, name: d.name, slug: d.slug, hitsPerDay: d.hitsPerDay })),
    rising: rising.slice(0, 5).map((d) => ({
      name: d.name,
      slug: d.slug,
      rank: d.rank!,
      rank1m: d.rank1m!,
      climb: d.rank1mDelta!,
    })),
    falling: falling.map((d) => ({ name: d.name, slug: d.slug, rank: d.rank, rank1m: d.rank1m!, drop: -(d.rank1mDelta ?? 0) })),
    linuxShare: last
      ? {
          month: monthName(new Date(last.capturedAt)),
          pct: last.sharePct,
          changePts:
            prev && monthsApart(prev.capturedAt, last.capturedAt) === 1
              ? Math.round((last.sharePct - prev.sharePct) * 100) / 100
              : null,
        }
      : null,
    totalTracked: list.length,
  };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain-text/markdown version, for review and for posting by hand. */
export function summaryMarkdown(s: MonthlySummary, site: string): string {
  const lines = [
    `# Linux distro rankings — ${s.month}`,
    "",
    `Top 10 by interest, last 12 months (captured ${s.capturedAt}):`,
    "",
    ...s.top10.map((d) => `${d.rank}. ${d.name}`),
    "",
    "Rising this month (top 100, last month vs 12 months):",
    "",
    ...(s.rising.length ? s.rising.map((d) => `- ${d.name}: #${d.rank} → #${d.rank1m} (▲${d.climb})`) : ["- none"]),
    "",
    "Cooling off:",
    "",
    ...(s.falling.length ? s.falling.map((d) => `- ${d.name}: #${d.rank} → #${d.rank1m} (▼${d.drop})`) : ["- none"]),
  ];
  if (s.linuxShare) {
    const ch = s.linuxShare.changePts;
    lines.push(
      "",
      `Linux desktop share worldwide (StatCounter, ${s.linuxShare.month}): ${s.linuxShare.pct.toFixed(2)}%${ch != null ? ` (${ch >= 0 ? "+" : ""}${ch.toFixed(2)} pts vs the month before)` : ""}.`,
    );
  }
  lines.push("", `Full rankings: ${site}/ · Rising: ${site}/rising/`, "", "Source: the LinuxStatistics composite index (Wikipedia views, DistroWatch page hits, GitHub stars, site views). Interest, not installs.");
  return lines.join("\n") + "\n";
}

/** Simple, inline-styled HTML email (no images needed to read it). */
export function summaryEmailHtml(s: MonthlySummary, site: string, cardUrl?: string): string {
  const li = (t: string) => `<li style="margin:4px 0">${t}</li>`;
  const a = (slug: string, name: string) => `<a href="${esc(site)}/distro/${esc(slug)}/" style="color:#111">${esc(name)}</a>`;
  return `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:20px">
<h1 style="font-size:22px;margin:0 0 4px">Linux distro rankings — ${esc(s.month)}</h1>
<p style="color:#555;margin:0 0 18px">Interest over the last 12 months, captured ${esc(s.capturedAt)}.</p>
${cardUrl ? `<img src="${esc(cardUrl)}" width="560" alt="Top distros for ${esc(s.month)}" style="width:100%;border-radius:8px;margin:0 0 18px">` : ""}
<h2 style="font-size:16px">Top 10</h2>
<ol style="padding-left:20px">${s.top10.map((d) => li(a(d.slug, d.name))).join("")}</ol>
<h2 style="font-size:16px">Rising this month</h2>
<ul style="padding-left:20px">${s.rising.length ? s.rising.map((d) => li(`${a(d.slug, d.name)}: #${d.rank} → #${d.rank1m} <b style="color:#1a7f4b">▲${d.climb}</b>`)).join("") : li("No climbers in the top 100.")}</ul>
${s.falling.length ? `<h2 style="font-size:16px">Cooling off</h2><ul style="padding-left:20px">${s.falling.map((d) => li(`${a(d.slug, d.name)}: #${d.rank} → #${d.rank1m} <b style="color:#b3263e">▼${d.drop}</b>`)).join("")}</ul>` : ""}
${s.linuxShare ? `<p>Linux desktop share worldwide (StatCounter, ${esc(s.linuxShare.month)}): <b>${s.linuxShare.pct.toFixed(2)}%</b>${s.linuxShare.changePts != null ? ` (${s.linuxShare.changePts >= 0 ? "+" : ""}${s.linuxShare.changePts.toFixed(2)} pts)` : ""}.</p>` : ""}
<p><a href="${esc(site)}/" style="color:#111">Full rankings</a> · <a href="${esc(site)}/rising/" style="color:#111">Rising</a> · <a href="${esc(site)}/pick/" style="color:#111">Which distro should I use?</a></p>
<p style="color:#777;font-size:12px">Source: the LinuxStatistics composite index (interest, not installs). You get this because you signed up at LinuxStatistics. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#777">Unsubscribe</a>.</p>
</body></html>`;
}
