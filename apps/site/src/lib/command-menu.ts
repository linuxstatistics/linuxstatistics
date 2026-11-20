import { compareSlug } from "./compare";
import { matchDistros, type SearchItem } from "../components/DistroSearch";
import { SOCIAL } from "../config/site";

export interface PageCommand {
  section: PageSection;
  href: string;
  label: string;
  /** Extra words people might type for this page. */
  keywords?: string;
}

export type Command =
  | { kind: "page"; id: string; label: string; href: string; section: PageSection }
  | { kind: "distro"; id: string; label: string; href: string; rank: number | null }
  | { kind: "compare"; id: string; label: string; href: string }
  | { kind: "action"; id: string; label: string; action: "theme" }
  | { kind: "link"; id: string; label: string; href: string; hint: string; /** Extra words people might type. */ keywords?: string };

/** Headed groups for pages, in display order. */
export const PAGE_SECTIONS = ["Explore", "Choose a distro", "Reference", "About"] as const;
export type PageSection = (typeof PAGE_SECTIONS)[number];

/** Every page the menu can open, grouped by section, in the order shown when nothing is typed. */
export const PAGE_COMMANDS: PageCommand[] = [
  { section: "Explore", href: "/", label: "Rankings", keywords: "home leaderboard chart top" },
  { section: "Explore", href: "/rising/", label: "Rising this month", keywords: "climbers trending movers" },
  { section: "Explore", href: "/compare/", label: "Compare distros", keywords: "vs versus side by side" },
  { section: "Explore", href: "/desktop-share/", label: "Desktop share over time", keywords: "market share statcounter windows macos" },
  { section: "Explore", href: "/stats/", label: "Linux by the numbers", keywords: "stats statistics numbers totals releases end of life" },
  { section: "Choose a distro", href: "/pick/", label: "Which distro? Take the quiz", keywords: "picker quiz choose recommend" },
  { section: "Choose a distro", href: "/best/", label: "Best Linux for…", keywords: "best gaming beginners old laptop low ram raspberry pi developers server privacy creative ai laptops" },
  { section: "Choose a distro", href: "/switch/", label: "Switch to Linux", keywords: "leave migrate" },
  { section: "Choose a distro", href: "/switch/windows/", label: "Switch from Windows", keywords: "windows 10 11 migrate" },
  { section: "Choose a distro", href: "/switch/mac/", label: "Switch from a Mac", keywords: "macos apple silicon migrate" },
  { section: "Reference", href: "/telemetry/", label: "Telemetry by distro", keywords: "privacy tracking data collection telemetry" },
  { section: "Reference", href: "/support-dates/", label: "Support dates", keywords: "end of life eol support lts lifecycle" },
  { section: "Reference", href: "/desktop/", label: "Desktops compared", keywords: "desktop environment gnome kde plasma xfce cinnamon mate cosmic budgie lxqt window manager hyprland sway i3 tiling" },
  { section: "Reference", href: "/glossary/", label: "Glossary", keywords: "terms definitions what is meaning rolling immutable flatpak desktop environment" },
  { section: "Reference", href: "/articles/", label: "Articles", keywords: "blog posts analysis method" },
  { section: "Reference", href: "/data/", label: "Open data", keywords: "download csv json api badge" },
  { section: "Reference", href: "/changelog/", label: "Changelog", keywords: "changes method corrections outages history" },
  { section: "About", href: "/about/", label: "About and sources", keywords: "method index sources" },
  { section: "About", href: "/about/ratings/", label: "How scores work", keywords: "ratings reviews" },
  { section: "About", href: "/suggest/", label: "Suggest a distro or fix", keywords: "add correction feedback" },
  { section: "About", href: "/sponsors/", label: "Sponsors", keywords: "advertise sponsor" },
  { section: "About", href: "/press/", label: "Press kit", keywords: "logo brand media" },
  { section: "About", href: "/privacy/", label: "Privacy", keywords: "data cookies" },
  { section: "About", href: "/terms/", label: "Terms and rules", keywords: "rules" },
];

const ACTIONS: Command[] = [{ kind: "action", id: "action:theme", label: "Switch theme (light / dark / system)", action: "theme" }];

const FOLLOW: Command[] = [
  ...SOCIAL.map((s): Command => ({ kind: "link", id: `link:${s.name}`, label: s.name, href: s.href, hint: s.handle })),
  { kind: "link", id: "link:feed", label: "Feed (Atom)", href: "/feed.xml", hint: "/feed.xml", keywords: "rss subscribe" },
];

const pageCmd = (p: PageCommand): Command => ({ kind: "page", id: `page:${p.href}`, label: p.label, href: p.href, section: p.section });
const distroCmd = (d: SearchItem): Command => ({
  kind: "distro",
  id: `distro:${d.slug}`,
  label: d.name,
  href: `/distro/${d.slug}/`,
  rank: d.rank,
});

/** Where a comparison lives: its prerendered page, else the any-pair view. */
export function compareHref(a: string, b: string, staticPairs: ReadonlySet<string>): string {
  const slug = compareSlug(a, b);
  return staticPairs.has(slug) ? `/compare/${slug}/` : `/compare/?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
}

/** How well a label matches: 3 exact, 2 prefix, 1 word prefix, 0 anything else. */
function matchStrength(label: string, q: string): number {
  const l = label.toLowerCase();
  if (l === q) return 3;
  if (l.startsWith(q)) return 2;
  return l.split(/[\s/()?-]+/).some((w) => w.startsWith(q)) ? 1 : 0;
}

/**
 * The menu and search in one list, already in display order (see groupCommands).
 * Nothing typed: every page, then the top distros, actions and the site's accounts.
 * Typing: a "mint vs fedora" comparison first, then the group with the best match
 * (pages win ties), then the rest.
 */
export function searchCommands(
  query: string,
  distros: SearchItem[],
  staticPairs: ReadonlySet<string> = new Set(),
  limit = 10,
): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const top = [...distros].filter((d) => d.rank != null).sort((a, b) => a.rank! - b.rank!).slice(0, 5);
    return [...PAGE_COMMANDS.map(pageCmd), ...top.map(distroCmd), ...ACTIONS, ...FOLLOW];
  }

  const out: Command[] = [];
  const vs = q.split(/\s+(?:vs\.?|versus)\s+/);
  if (vs.length === 2 && vs[0] && vs[1]) {
    const a = matchDistros(distros, vs[0], 1)[0];
    const b = matchDistros(distros, vs[1], 1)[0];
    if (a && b && a.slug !== b.slug) {
      out.push({ kind: "compare", id: `compare:${compareSlug(a.slug, b.slug)}`, label: `${a.name} vs ${b.name}`, href: compareHref(a.slug, b.slug, staticPairs) });
    }
  }

  const words = q.split(/\s+/);
  const hit = (text: string) => words.every((w) => text.toLowerCase().includes(w));
  const pages = PAGE_COMMANDS.filter((p) => hit(`${p.label} ${p.keywords ?? ""}`)).map(pageCmd);
  const found = matchDistros(distros, q, limit).map(distroCmd);
  const best = (list: Command[]) => Math.max(-1, ...list.map((c) => matchStrength(c.label, q)));
  const groups = best(found) > best(pages) ? [found, pages] : [pages, found];
  for (const g of groups) out.push(...g);
  out.push(...ACTIONS.filter((a) => hit(a.label)));
  out.push(...FOLLOW.filter((f) => f.kind === "link" && hit(`follow on ${f.label} ${f.hint} ${f.keywords ?? ""}`)));
  return out.slice(0, limit);
}

export const GROUP_LABEL: Record<Command["kind"], string> = { compare: "Compare", distro: "Distros", page: "Pages", action: "Actions", link: "Follow" };

export interface CommandGroup {
  kind: Command["kind"];
  /** Unique per group: the kind, or `page:<section>` for pages. */
  key: string;
  label: string;
  items: Command[];
}

/**
 * Results grouped for display, in the order searchCommands put them. Pages split
 * into their headed sections (Explore, Choose a distro, Reference, About), so the
 * full menu reads as short labelled lists instead of one long one.
 */
export function groupCommands(results: Command[]): CommandGroup[] {
  const groups: CommandGroup[] = [];
  for (const r of results) {
    const key = r.kind === "page" ? `page:${r.section}` : r.kind;
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(r);
    else groups.push({ kind: r.kind, key, label: r.kind === "page" ? r.section : GROUP_LABEL[r.kind], items: [r] });
  }
  return groups;
}
