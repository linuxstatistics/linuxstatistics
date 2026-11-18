import type { APIRoute } from "astro";
import { loadDistros } from "../lib/data";
import { llmsIndex, TEXT_HEADERS } from "../lib/llms";
import { loadArticles } from "../lib/article-entries";
import { isHubLive } from "../lib/articles";
import { ARTICLE_TOPICS } from "../lib/article-topics";

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL("https://linuxstatistics.com")).href.replace(/\/$/, "");
  const list = await loadDistros();
  const cards = (await loadArticles()).map((a) => a.card);
  // Live hubs only: a thin hub is noindex, so it isn't advertised here either.
  const hubs = ARTICLE_TOPICS.filter((t) => isHubLive(cards, t.slug));
  return new Response(llmsIndex(base, list.length, hubs), { headers: TEXT_HEADERS });
};
