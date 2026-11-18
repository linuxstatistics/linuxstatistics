import type { APIRoute, GetStaticPaths } from "astro";
import { loadArticles } from "../../../lib/article-entries";
import { ATOM_HEADERS, renderAtom } from "../../../lib/feed";
import { articleFeedItems } from "../../../lib/article-feed";
import { hubArticles, isHubLive } from "../../../lib/articles";
import { ARTICLE_TOPICS, topicBySlug } from "../../../lib/article-topics";

// One feed per live topic hub; thin hubs have no feed.
export const getStaticPaths: GetStaticPaths = async () => {
  const cards = (await loadArticles()).map((a) => a.card);
  return ARTICLE_TOPICS.filter((t) => isHubLive(cards, t.slug)).map((t) => ({ params: { slug: t.slug } }));
};

export const GET: APIRoute = async ({ params, site }) => {
  const base = site ?? new URL("https://linuxstatistics.com");
  const topic = topicBySlug(params.slug!)!;
  const items = articleFeedItems(hubArticles((await loadArticles()).map((a) => a.card), topic.slug), base);
  const body = renderAtom({ title: `LinuxStatistics: ${topic.name}`, subtitle: topic.intro, self: new URL(`/articles/${topic.slug}/feed.xml`, base).href, home: new URL(`/articles/${topic.slug}/`, base).href, items });
  return new Response(body, { headers: ATOM_HEADERS });
};
