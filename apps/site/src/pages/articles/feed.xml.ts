import type { APIRoute } from "astro";
import { loadArticles } from "../../lib/article-entries";
import { ATOM_HEADERS, renderAtom } from "../../lib/feed";
import { articleFeedItems } from "../../lib/article-feed";

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://linuxstatistics.com");
  const items = articleFeedItems((await loadArticles()).map((a) => a.card), base);
  const body = renderAtom({ title: "LinuxStatistics articles", subtitle: "Analysis, guides and answers about Linux distros, built on our own data.", self: new URL("/articles/feed.xml", base).href, home: new URL("/articles/", base).href, items });
  return new Response(body, { headers: ATOM_HEADERS });
};
