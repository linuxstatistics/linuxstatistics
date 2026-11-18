import type { FeedItem } from "./feed";
import type { ArticleCard } from "./articles";
import { TYPE_LABEL } from "./article-topics";

/** Feed items for published articles, newest first. */
export function articleFeedItems(cards: ArticleCard[], site: URL): FeedItem[] {
  return cards
    .filter((a) => !a.draft)
    .map((a) => {
      const link = new URL(`/articles/${a.slug}/`, site).href;
      return { id: link, title: `${TYPE_LABEL[a.type]}: ${a.title}`, updated: (a.updated ?? a.published).toISOString().slice(0, 10), link, summary: a.description };
    })
    .sort((x, y) => y.updated.localeCompare(x.updated));
}
