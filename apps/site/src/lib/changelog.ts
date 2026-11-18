import { SOURCE_LABEL, type COMPOSITE_WEIGHTS, type SourceEvent } from "@linux-statistics/shared";
import { SOURCE_URL } from "../config/site";
import type { FeedItem } from "./feed";

export type ChangeKind = "method" | "correction";

export interface ChangeEntry {
  /** YYYY-MM-DD the change went live. */
  date: string;
  kind: ChangeKind;
  title: string;
  /** What changed and why, in plain sentences. */
  body: string;
  /** Our slugs of the distros it affects, when it targets specific ones. */
  distros?: string[];
  /** Evidence: source pages, the commit, the method section. */
  links?: { label: string; href: string }[];
  /** Method entries record the index weights they put in place (see the test). */
  weights?: Record<keyof typeof COMPOSITE_WEIGHTS, number>;
}

const commit = (sha: string) => `${SOURCE_URL}/commit/${sha}`;

/**
 * Everything that changes the numbers on the site, written by hand and
 * committed with the code it describes. Newest first. A change to the
 * index weights needs a new "method" entry with the new weights, or the
 * test fails. Source outages are added automatically from ingestion runs.
 */
export const CHANGELOG: ChangeEntry[] = [
  {
    date: "2026-11-18",
    kind: "correction",
    title: "ChromeOS and FydeOS moved from the Gentoo family to independent",
    body: "ChromeOS is built with Gentoo's Portage tools but is Google's own system, not a Gentoo distro. ChromeOS and FydeOS (which is based on ChromeOS) now show as independent. Their ranks don't change.",
    distros: ["chromeos", "fydeos"],
    links: [{ label: "ChromeOS on Wikipedia", href: "https://en.wikipedia.org/wiki/ChromeOS" }],
  },
  {
    date: "2026-11-13",
    kind: "correction",
    title: "Telemetry checked for 40 more distros, new \"sends usage data\" level",
    body: "We checked what 40 more of the most popular distros send home by default, each against the project's own documentation or build files. ChromeOS, Red Hat Enterprise Linux and TrueNAS send more than an install count by default, so they now show a separate \"sends usage data\" level and the quiz scores them lower for people who want no telemetry.",
    distros: ["chromeos", "redhat", "truenas"],
    links: [{ label: "Commit", href: commit("9cf2bfe") }],
  },
  {
    date: "2026-11-08",
    kind: "method",
    title: "The public rank is now our own composite index",
    body: "Until now the chart followed one website's page-hit ranking. It now combines four interest signals so no single site decides the order: English Wikipedia article views (50%), DistroWatch's 12-month page-hit rank (30%), GitHub stars on the main repository (10%) and views of the distro's page here (10%). Ranks moved for many distros. All four measure interest, not installs.",
    links: [
      { label: "How we rank distros", href: "/about/#ranking" },
      { label: "Commit", href: commit("9e7fcce") },
    ],
    weights: { interest: 0.5, distrowatch: 0.3, github: 0.1, siteViews: 0.1 },
  },
  {
    date: "2026-11-06",
    kind: "method",
    title: "Distros are identified by our own names, not another site's IDs",
    body: "Each distro now has its own address on this site (for example /distro/mint/), and IDs from other sites are stored only as aliases. Old addresses redirect to the new ones. Rankings no longer depend on how another site groups or names a distro.",
    links: [{ label: "Commit", href: commit("29704e3") }],
  },
];

/** Entries that name `slug`, newest first. */
export function entriesFor(slug: string, entries: ChangeEntry[] = CHANGELOG): ChangeEntry[] {
  return entries.filter((e) => e.distros?.includes(slug));
}

export const KIND_LABEL: Record<ChangeKind | "source", string> = {
  method: "Method",
  correction: "Correction",
  source: "Source",
};

/** One row on the page or in the feed: a hand-written entry or a computed source outage. */
export interface ChangeRow {
  id: string;
  date: string;
  kind: ChangeKind | "source";
  title: string;
  body: string;
  distros: string[];
  links: { label: string; href: string }[];
  /** Source outage still going on. */
  ongoing?: boolean;
}

const dayText = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const every = (days: number) => (days === 1 ? "daily" : days === 7 ? "weekly" : days >= 28 ? "monthly" : `every ${days} days`);

/** Plain sentence for a source outage. */
export function sourceRow(e: SourceEvent): ChangeRow {
  const label = SOURCE_LABEL[e.source];
  const span = e.to ? `from ${dayText(e.from)} to ${dayText(e.to)}` : `since ${dayText(e.from)}`;
  const failed = e.failedRuns > 0 ? ` ${e.failedRuns} update attempt${e.failedRuns === 1 ? "" : "s"} failed in that time.` : "";
  return {
    id: `source-${e.source}-${e.from.slice(0, 10)}`,
    date: (e.to ?? e.from).slice(0, 10),
    kind: "source",
    title: e.to ? `${label}: no update for ${e.days} days` : `${label}: not updated since ${dayText(e.from)}`,
    body: `${label} normally updates ${every(e.cadenceDays)}. There was no successful update ${span}.${failed} The site kept showing the last good data${e.to ? " until the update came in" : ""}.`,
    distros: [],
    links: [{ label: "Where the numbers come from", href: "/about/" }],
    ongoing: e.to == null,
  };
}

export function entryRow(e: ChangeEntry): ChangeRow {
  return { id: `${e.kind}-${e.date}-${slugify(e.title)}`, date: e.date, kind: e.kind, title: e.title, body: e.body, distros: e.distros ?? [], links: e.links ?? [] };
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** Hand-written entries and source outages, newest first. */
export function changeRows(sourceEvents: SourceEvent[], entries: ChangeEntry[] = CHANGELOG): ChangeRow[] {
  // Ongoing outages lead: they describe the numbers on the page right now.
  return [...entries.map(entryRow), ...sourceEvents.map(sourceRow)].sort((a, b) => Number(b.ongoing ?? false) - Number(a.ongoing ?? false) || b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind));
}

/** Feed items: each links to its anchor on /changelog/. No rank numbers (export rule). */
export function changeFeedItems(rows: ChangeRow[], site: URL): FeedItem[] {
  return rows.map((r) => ({
    id: `tag:linuxstatistics.com,2026:changelog/${r.id}`,
    title: `${KIND_LABEL[r.kind]}: ${r.title}`,
    updated: r.date,
    link: new URL(`/changelog/#${r.id}`, site).href,
    summary: r.body,
  }));
}
