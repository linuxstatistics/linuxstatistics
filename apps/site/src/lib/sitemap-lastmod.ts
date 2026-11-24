import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Meta } from "@linux-statistics/shared";
import { POLICIES_UPDATED } from "../config/site";
import { readFrontmatter } from "./frontmatter";
import { STATUS_REVIEWED } from "./miami-status";

/**
 * Sitemap <lastmod> per page: the date its main content last changed, not the
 * build time. Pages without a date we can stand behind get none (the sitemap
 * protocol makes lastmod optional, and search engines ignore dates that move
 * on every build).
 */
export interface LastmodContext {
  /** Latest successful data ingest (YYYY-MM-DD); null when no source has run. */
  data: string | null;
  /** Published article slug -> updated or published date (YYYY-MM-DD). */
  articles: Record<string, string>;
  /** Legal pages' last change (YYYY-MM-DD). */
  policies: string;
}

/** Pages whose content is rebuilt from the data: rankings, distro facts, comparisons, totals. */
const DATA_PAGES = [
  /^\/$/,
  /^\/distro\//,
  /^\/compare\//,
  /^\/rising\//,
  /^\/best\//,
  /^\/pick\/$/,
  /^\/stats\//,
  /^\/desktop-share\//,
  /^\/support-dates\//,
  /^\/telemetry\//,
  /^\/data\//,
  /^\/changelog\//,
  /^\/switch\//,
];
const POLICY_PAGES = new Set(["/privacy/", "/terms/"]);

export function lastmodFor(url: string, ctx: LastmodContext): string | undefined {
  const path = new URL(url).pathname;
  if (POLICY_PAGES.has(path)) return ctx.policies;
  // Kept by hand, so its date is the one the page itself shows as "Updated".
  if (path === "/can-i-run/gta-vi/") return STATUS_REVIEWED;
  const article = path.match(/^\/articles\/([^/]+)\/$/);
  if (article && ctx.articles[article[1]!]) return ctx.articles[article[1]!];
  // The articles index and topic hubs change when an article is added or updated.
  if (path.startsWith("/articles/")) return newest(Object.values(ctx.articles));
  if (DATA_PAGES.some((re) => re.test(path))) return ctx.data ?? undefined;
  return undefined;
}

const newest = (dates: (string | null | undefined)[]) => dates.filter((d): d is string => !!d).sort().at(-1);

/** Latest successful ingest across sources. */
export function dataDate(meta: Pick<Meta, "sources">): string | null {
  return newest(meta.sources.map((s) => s.lastSuccessAt?.slice(0, 10))) ?? null;
}

const day = (v: unknown) => {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
};

/** Article dates from the published articles folder (drafts never reach the sitemap). */
export function articleDates(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const fm = readFrontmatter(readFileSync(join(dir, f), "utf8"));
    const date = fm && (day(fm.data.updated) ?? day(fm.data.published));
    if (date) out[f.replace(/\.md$/, "")] = date;
  }
  return out;
}

export async function loadLastmodContext(apiUrl: string, articlesDir: string): Promise<LastmodContext> {
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/meta`);
  if (!res.ok) throw new Error(`sitemap lastmod: GET /api/meta -> ${res.status}`);
  return { data: dataDate((await res.json()) as Meta), articles: articleDates(articlesDir), policies: POLICIES_UPDATED };
}
