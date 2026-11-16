import { z } from "astro/zod";

export const articleFrontmatter = z.object({
  title: z.string().min(5).max(110),
  description: z.string().min(20).max(200),
  published: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).min(1).max(5),
});
export type ArticleMeta = z.infer<typeof articleFrontmatter>;

export interface ArticleCard {
  slug: string;
  title: string;
  description: string;
  published: Date;
  updated?: Date;
  tags: string[];
  minutes: number;
  draft: boolean;
}

/** Drafts load only on the dev server and only when a drafts folder is set. */
export function draftsEnabled(dev: boolean, dir: string | undefined): boolean {
  return dev && Boolean(dir && dir.trim());
}

/** Reading time at ~220 words a minute, at least one minute. */
export function readingMinutes(body: string): number {
  const words = body.replace(/```[\s\S]*?```/g, " ").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Newest first; drafts after published articles of the same date. */
export function sortArticles<T extends Pick<ArticleCard, "published" | "slug">>(list: T[]): T[] {
  return [...list].sort((a, b) => b.published.getTime() - a.published.getTime() || a.slug.localeCompare(b.slug));
}

/** Up to `n` other articles, those sharing the most tags first, then newest. */
export function relatedArticles(current: ArticleCard, all: ArticleCard[], n = 3): ArticleCard[] {
  const tags = new Set(current.tags);
  // A published article never links to a draft; a draft can see everything.
  return sortArticles(all.filter((a) => a.slug !== current.slug && (current.draft || !a.draft)))
    .map((a) => ({ a, shared: a.tags.filter((t) => tags.has(t)).length }))
    .sort((x, y) => y.shared - x.shared)
    .slice(0, n)
    .map((x) => x.a);
}

export const fmtArticleDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const NEW_TAB = ' target="_blank" rel="noopener noreferrer" title="Opens in a new tab" aria-describedby="new-tab-description"';

/** External links in rendered article HTML open in a new tab, like every other external link on the site. */
export function externalLinksNewTab(html: string, site = "https://linuxstatistics.com"): string {
  return html.replace(/<a href="(https?:\/\/[^"]+)"(?![^>]*target=)/g, (m, href: string) => (href.startsWith(site) ? m : `<a href="${href}"${NEW_TAB}`));
}
