import { compareSlug } from "./compare";
import { matchDistros, type SearchItem } from "../components/DistroSearch";
import { SOCIAL } from "../config/site";

export interface PageCommand {
  href: string;
  label: string;
  /** Extra words people might type for this page. */
  keywords?: string;
}

export type Command =
  | { kind: "page"; id: string; label: string; href: string }
  | { kind: "distro"; id: string; label: string; href: string; rank: number | null }
  | { kind: "compare"; id: string; label: string; href: string }
  | { kind: "action"; id: string; label: string; action: "theme" }
  | { kind: "link"; id: string; label: string; href: string; hint: string };

/** Every page the menu can open, in the order shown when nothing is typed. */
export const PAGE_COMMANDS: PageCommand[] = [
  { href: "/", label: "Rankings", keywords: "home leaderboard chart top" },
  { href: "/rising/", label: "Rising this month", keywords: "climbers trending movers" },
  { href: "/pick/", label: "Which distro? Take the quiz", keywords: "picker quiz choose recommend" },
  { href: "/switch/", label: "Switch to Linux", keywords: "leave migrate" },
  { href: "/switch/windows/", label: "Switch from Windows", keywords: "windows 10 11 migrate" },
  { href: "/switch/mac/", label: "Switch from a Mac", keywords: "macos apple silicon migrate" },
  { href: "/compare/", label: "Compare distros", keywords: "vs versus side by side" },
  { href: "/desktop-share/", label: "Desktop share over time", keywords: "market share statcounter windows macos" },
  { href: "/stats/", label: "Linux by the numbers", keywords: "stats statistics numbers totals releases end of life" },
  { href: "/articles/", label: "Articles", keywords: "blog posts analysis method" },
  { href: "/data/", label: "Open data", keywords: "download csv json api badge" },
  { href: "/about/", label: "About and sources", keywords: "method index sources" },
  { href: "/about/ratings/", label: "How scores work", keywords: "ratings reviews" },
  { href: "/suggest/", label: "Suggest a distro or fix", keywords: "add correction feedback" },
  { href: "/sponsors/", label: "Sponsors", keywords: "advertise sponsor" },
  { href: "/press/", label: "Press kit", keywords: "logo brand media" },
  { href: "/privacy/", label: "Privacy", keywords: "data cookies" },
  { href: "/terms/", label: "Terms and rules", keywords: "rules" },
];

const ACTIONS: Command[] = [{ kind: "action", id: "action:theme", label: "Switch theme (light / dark / system)", action: "theme" }];

const FOLLOW: Command[] = SOCIAL.map((s) => ({ kind: "link", id: `link:${s.name}`, label: `Follow on ${s.name}`, href: s.href, hint: s.handle }));

const pageCmd = (p: PageCommand): Command => ({ kind: "page", id: `page:${p.href}`, label: p.label, href: p.href });
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
  out.push(...FOLLOW.filter((f) => f.kind === "link" && hit(`${f.label} ${f.hint}`)));
  return out.slice(0, limit);
}

export const GROUP_LABEL: Record<Command["kind"], string> = { compare: "Compare", distro: "Distros", page: "Pages", action: "Actions", link: "Follow" };

/** Results grouped for display, in the order searchCommands put them. */
export function groupCommands(results: Command[]): { kind: Command["kind"]; items: Command[] }[] {
  const groups: { kind: Command["kind"]; items: Command[] }[] = [];
  for (const r of results) {
    const g = groups.find((x) => x.kind === r.kind);
    if (g) g.items.push(r);
    else groups.push({ kind: r.kind, items: [r] });
  }
  return groups;
}
