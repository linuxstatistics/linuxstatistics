import type { DistroDetail } from "@linux-statistics/shared";

/**
 * Atom feeds. Items are dated events that already have a page: release cycles
 * (endoflife.date, CC BY-SA 4.0, credited in every item) and the monthly movers
 * page. No rank numbers or scores: feeds are an export, and ranking data is only
 * shown on our own pages.
 */
export interface FeedItem {
  id: string;
  title: string;
  updated: string; // YYYY-MM-DD
  link: string; // absolute
  summary: string;
}

const RELEASE_CREDIT = "Release data from endoflife.date (CC BY-SA 4.0).";
const MAX_AGE_DAYS = 730;

function day(iso: string): string {
  return iso.slice(0, 10);
}

/** One item per release cycle and per newer point release, newest first, within `maxAgeDays` (two years by default). */
export function releaseItems(d: Pick<DistroDetail, "slug" | "name" | "releases">, site: URL, now = new Date(), maxAgeDays = MAX_AGE_DAYS): FeedItem[] {
  const cutoff = new Date(now.getTime() - maxAgeDays * 86_400_000).toISOString().slice(0, 10);
  const link = new URL(`/distro/${d.slug}/`, site).href;
  const items: FeedItem[] = [];
  for (const r of d.releases) {
    const label = `${d.name} ${r.cycle}${r.codename ? ` (${r.codename})` : ""}`;
    const support = r.supportEnds ? ` Supported until ${day(r.supportEnds)}.` : "";
    if (r.releasedOn && day(r.releasedOn) >= cutoff) {
      items.push({
        id: `tag:linuxstatistics.com,2026:release/${d.slug}/${r.cycle}`,
        title: `${label} released${r.lts ? " (long-term support)" : ""}`,
        updated: day(r.releasedOn),
        link,
        summary: `${label} was released on ${day(r.releasedOn)}.${support} ${RELEASE_CREDIT}`,
      });
    }
    if (r.latest && r.latestOn && r.latest !== r.cycle && day(r.latestOn) >= cutoff && day(r.latestOn) !== (r.releasedOn && day(r.releasedOn))) {
      items.push({
        id: `tag:linuxstatistics.com,2026:release/${d.slug}/${r.cycle}/${r.latest}`,
        title: `${d.name} ${r.latest} update`,
        updated: day(r.latestOn),
        link,
        summary: `${d.name} ${r.latest}, an update to the ${r.cycle} release, came out on ${day(r.latestOn)}. ${RELEASE_CREDIT}`,
      });
    }
  }
  return sortItems(items);
}

/** The month's movers page, dated by the latest index rebuild. Title only: numbers stay on the page. */
export function moversItem(asOf: string, site: URL): FeedItem {
  const date = new Date(`${day(asOf)}T00:00:00Z`);
  const month = date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const key = day(asOf).slice(0, 7);
  return {
    id: `tag:linuxstatistics.com,2026:movers/${key}`,
    title: `Rising and falling distros: ${month}`,
    updated: day(asOf),
    link: new URL("/rising/", site).href,
    summary: `Which Linux distros gained and lost the most interest over the last month, updated ${day(asOf)}.`,
  };
}

export function sortItems(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderAtom(opts: { title: string; subtitle: string; self: string; home: string; items: FeedItem[] }): string {
  const updated = opts.items[0]?.updated ?? "2026-01-01";
  const entries = opts.items
    .map((i) => `  <entry>
    <id>${esc(i.id)}</id>
    <title>${esc(i.title)}</title>
    <updated>${i.updated}T00:00:00Z</updated>
    <link rel="alternate" type="text/html" href="${esc(i.link)}"/>
    <summary>${esc(i.summary)}</summary>
  </entry>`)
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${esc(opts.self)}</id>
  <title>${esc(opts.title)}</title>
  <subtitle>${esc(opts.subtitle)}</subtitle>
  <updated>${updated}T00:00:00Z</updated>
  <link rel="self" type="application/atom+xml" href="${esc(opts.self)}"/>
  <link rel="alternate" type="text/html" href="${esc(opts.home)}"/>
  <author><name>LinuxStatistics</name></author>
  <rights>Release data from endoflife.date, CC BY-SA 4.0.</rights>
${entries}
</feed>
`;
}

export const ATOM_HEADERS = { "Content-Type": "application/atom+xml; charset=utf-8" };
