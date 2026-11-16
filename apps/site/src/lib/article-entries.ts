import { getCollection, type CollectionEntry } from "astro:content";
import { readingMinutes, sortArticles, type ArticleCard } from "./articles";

export interface ArticleEntry {
  entry: CollectionEntry<"articles"> | CollectionEntry<"drafts">;
  card: ArticleCard;
}

/** Published articles, plus drafts on the dev server. A slug in both uses the published one. */
export async function loadArticles(): Promise<ArticleEntry[]> {
  const published = await getCollection("articles");
  const drafts = import.meta.env.DEV ? await getCollection("drafts") : [];
  const seen = new Set(published.map((e) => e.id));
  const all: ArticleEntry[] = [
    ...published.map((entry) => ({ entry, draft: false })),
    ...drafts.filter((e) => !seen.has(e.id)).map((entry) => ({ entry, draft: true })),
  ].map(({ entry, draft }) => ({
    entry,
    card: { slug: entry.id, ...entry.data, minutes: readingMinutes(entry.body ?? ""), draft },
  }));
  const order = sortArticles(all.map((a) => a.card));
  return order.map((c) => all.find((a) => a.card === c)!);
}
