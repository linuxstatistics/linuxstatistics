import { compareSlug } from "./compare";
import { matchDistros, type SearchItem } from "../components/DistroSearch";

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
  | { kind: "action"; id: string; label: string; action: "theme" };

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

/**
 * Results for what's typed. Nothing typed: pages, then the top distros.
 * "mint vs fedora" (or "mint fedora" with "vs"/"versus") becomes a comparison.
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
    return [...PAGE_COMMANDS.slice(0, 7).map(pageCmd), ...top.map(distroCmd), ...ACTIONS];
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

  out.push(...matchDistros(distros, q, limit).map(distroCmd));
  const words = q.split(/\s+/);
  const pages = PAGE_COMMANDS.filter((p) => {
    const hay = `${p.label} ${p.keywords ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  out.push(...pages.map(pageCmd));
  out.push(...ACTIONS.filter((a) => a.label.toLowerCase().includes(q)));
  return out.slice(0, limit);
}

/** Display order of result groups; results are always contiguous per group. */
export const GROUP_ORDER: Command["kind"][] = ["compare", "distro", "page", "action"];
export const GROUP_LABEL: Record<Command["kind"], string> = { compare: "Compare", distro: "Distros", page: "Pages", action: "Actions" };

/** Results grouped for display, keeping each group's internal order. */
export function groupCommands(results: Command[]): { kind: Command["kind"]; items: Command[] }[] {
  return GROUP_ORDER.map((kind) => ({ kind, items: results.filter((r) => r.kind === kind) })).filter((g) => g.items.length > 0);
}
