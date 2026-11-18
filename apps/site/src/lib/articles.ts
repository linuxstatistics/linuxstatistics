import { z } from "astro/zod";
import { ARTICLE_TYPES, GUIDE_STALE_MONTHS, MIN_HUB_ARTICLES, TOPIC_SLUGS, type ArticleType, type TopicSlug } from "./article-topics";

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** A Q&A answer is shown first and becomes the FAQ markup: long enough to answer, short enough to quote. */
export const ANSWER_WORDS = { min: 40, max: 60 } as const;

export const articleFrontmatter = z
  .object({
    title: z.string().min(5).max(110),
    description: z.string().min(20).max(200),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    topic: z.enum(TOPIC_SLUGS),
    alsoIn: z.array(z.enum(TOPIC_SLUGS)).max(2).optional(),
    type: z.enum(ARTICLE_TYPES),
    distros: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(10).optional(),
    question: z.string().min(10).max(160).optional(),
    answer: z.string().optional(),
    checked: z.coerce.date().optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (a.alsoIn?.includes(a.topic)) ctx.addIssue({ code: "custom", path: ["alsoIn"], message: "alsoIn repeats the main topic" });
    if (a.alsoIn && new Set(a.alsoIn).size !== a.alsoIn.length) ctx.addIssue({ code: "custom", path: ["alsoIn"], message: "alsoIn lists a topic twice" });
    if (a.type === "qa") {
      if (!a.question) ctx.addIssue({ code: "custom", path: ["question"], message: "Q&A articles need a question" });
      const n = a.answer ? wordCount(a.answer) : 0;
      if (n < ANSWER_WORDS.min || n > ANSWER_WORDS.max) ctx.addIssue({ code: "custom", path: ["answer"], message: `Q&A answer needs ${ANSWER_WORDS.min} to ${ANSWER_WORDS.max} words (has ${n})` });
    } else if (a.question || a.answer) {
      ctx.addIssue({ code: "custom", path: ["question"], message: "question and answer are for Q&A articles only" });
    }
    if (a.type === "guide" && !a.checked) ctx.addIssue({ code: "custom", path: ["checked"], message: "guides need a checked date" });
  });
export type ArticleMeta = z.infer<typeof articleFrontmatter>;

export interface ArticleCard {
  slug: string;
  title: string;
  description: string;
  published: Date;
  updated?: Date;
  topic: TopicSlug;
  alsoIn: TopicSlug[];
  type: ArticleType;
  distros: string[];
  question?: string;
  answer?: string;
  checked?: Date;
  minutes: number;
  draft: boolean;
}

/** Card fields from validated front matter. */
export function toCard(slug: string, m: ArticleMeta, minutes: number, draft: boolean): ArticleCard {
  return { slug, title: m.title, description: m.description, published: m.published, updated: m.updated, topic: m.topic, alsoIn: m.alsoIn ?? [], type: m.type, distros: m.distros ?? [], question: m.question, answer: m.answer, checked: m.checked, minutes, draft };
}

/** Topics an article appears under: its main topic, then alsoIn. */
export const topicsOf = (a: Pick<ArticleCard, "topic" | "alsoIn">): TopicSlug[] => [a.topic, ...a.alsoIn];

/** Published articles per topic (main or alsoIn). Drafts never count. */
export function publishedCount(cards: ArticleCard[], topic: string): number {
  return cards.filter((a) => !a.draft && topicsOf(a).includes(topic as TopicSlug)).length;
}

/** A hub is live (indexed and linked) at MIN_HUB_ARTICLES published articles. */
export const isHubLive = (cards: ArticleCard[], topic: string) => publishedCount(cards, topic) >= MIN_HUB_ARTICLES;

/** Hub pages that are built but not live: noindex and out of the sitemap. */
export const thinHubPaths = (cards: ArticleCard[]) => TOPIC_SLUGS.filter((t) => !isHubLive(cards, t)).map((t) => `/articles/${t}/`);

/** Articles on a hub (main or alsoIn), newest first; drafts only when the caller includes them. */
export const hubArticles = (cards: ArticleCard[], topic: string) => sortArticles(cards.filter((a) => topicsOf(a).includes(topic as TopicSlug)));

/** The index: each article once, under its main topic, topics in display order, empty topics left out. */
export function groupByTopic(cards: ArticleCard[]): { topic: TopicSlug; articles: ArticleCard[] }[] {
  return TOPIC_SLUGS.map((topic) => ({ topic, articles: sortArticles(cards.filter((a) => a.topic === topic)) })).filter((g) => g.articles.length > 0);
}

/** Articles per topic on the index; a live hub's page lists the rest. */
export const INDEX_PER_TOPIC = 3;
/** The "Latest" row shows this many, and only once there are more articles than that. */
export const INDEX_LATEST = 3;

/** The /articles/ page: a latest row, jump links, and per-topic sections capped when the hub is live. */
export function articleIndex(cards: ArticleCard[]) {
  const latest = cards.length > INDEX_LATEST ? sortArticles(cards).slice(0, INDEX_LATEST) : [];
  const sections = groupByTopic(cards).map(({ topic, articles }) => {
    const live = isHubLive(cards, topic);
    // A thin hub has no page to point to, so every article stays here.
    const shown = live ? articles.slice(0, INDEX_PER_TOPIC) : articles;
    return { topic, live, articles: shown, more: articles.length - shown.length };
  });
  return { latest, sections, jump: sections.map((x) => x.topic) };
}

/** Guides whose steps were last checked more than GUIDE_STALE_MONTHS ago. */
export function staleGuides(cards: ArticleCard[], now = new Date()): ArticleCard[] {
  const limit = new Date(now);
  limit.setUTCMonth(limit.getUTCMonth() - GUIDE_STALE_MONTHS);
  return cards.filter((a) => a.type === "guide" && a.checked != null && a.checked < limit);
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

/** Up to `n` other articles: same main topic first, then shared distros, then newest. */
export function relatedArticles(current: ArticleCard, all: ArticleCard[], n = 3): ArticleCard[] {
  const distros = new Set(current.distros);
  // A published article never links to a draft; a draft can see everything.
  return sortArticles(all.filter((a) => a.slug !== current.slug && (current.draft || !a.draft)))
    .map((a, i) => ({ a, i, same: a.topic === current.topic ? 1 : 0, shared: a.distros.filter((d) => distros.has(d)).length }))
    .sort((x, y) => y.same - x.same || y.shared - x.shared || x.i - y.i)
    .slice(0, n)
    .map((x) => x.a);
}

export const fmtArticleDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const NEW_TAB = ' target="_blank" rel="noopener noreferrer" title="Opens in a new tab" aria-describedby="new-tab-description"';

/** External links in rendered article HTML open in a new tab, like every other external link on the site. */
export function externalLinksNewTab(html: string, site = "https://linuxstatistics.com"): string {
  return html.replace(/<a href="(https?:\/\/[^"]+)"(?![^>]*target=)/g, (m, href: string) => (href.startsWith(site) ? m : `<a href="${href}"${NEW_TAB}`));
}
