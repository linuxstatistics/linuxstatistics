import type { APIRoute } from "astro";
import { loadDistro, loadDistros, loadMeta, mapLimit } from "../lib/data";
import { ATOM_HEADERS, moversItem, releaseItems, renderAtom, sortItems, type FeedItem } from "../lib/feed";
import { loadArticles } from "../lib/article-entries";
import { CHANGELOG, changeFeedItems, entryRow } from "../lib/changelog";

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://linuxstatistics.com");
  const [list, meta] = await Promise.all([loadDistros(), loadMeta()]);
  const details = await mapLimit(list, 8, (d) => loadDistro(d.slug));
  const index = meta.sources.find((s) => s.source === "wikipedia")?.lastSuccessAt;
  const articles: FeedItem[] = (await loadArticles())
    .filter((a) => !a.card.draft)
    .map(({ card: a }) => {
      const link = new URL(`/articles/${a.slug}/`, base).href;
      return { id: link, title: a.title, updated: (a.updated ?? a.published).toISOString().slice(0, 10), link, summary: a.description };
    });
  const changes = changeFeedItems(CHANGELOG.map(entryRow), base);
  const items = sortItems([...articles, ...changes, ...details.flatMap((d) => releaseItems(d, base)), ...(index ? [moversItem(index, base)] : [])]).slice(0, 50);
  const body = renderAtom({
    title: "LinuxStatistics",
    subtitle: "Articles, changes to our rankings and data, new Linux distro releases and the monthly movers.",
    self: new URL("/feed.xml", base).href,
    home: base.href,
    items,
  });
  return new Response(body, { headers: ATOM_HEADERS });
};
