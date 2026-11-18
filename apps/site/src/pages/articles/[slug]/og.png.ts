import type { APIRoute, GetStaticPaths } from "astro";
import { loadArticles } from "../../../lib/article-entries";
import { ARTICLE_TOPICS, TYPE_LABEL, topicBySlug } from "../../../lib/article-topics";
import { renderArticleCard } from "../../../lib/og-card";

// One share image per article and per topic hub (thin hubs too: the page exists, it's just noindex).
export const getStaticPaths: GetStaticPaths = async () => {
  const cards = (await loadArticles()).map((a) => a.card);
  return [
    ...ARTICLE_TOPICS.map((t) => ({ params: { slug: t.slug }, props: { kicker: "Articles", title: `${t.name} on Linux` } })),
    ...cards.map((a) => ({ params: { slug: a.slug }, props: { kicker: `${TYPE_LABEL[a.type]} · ${topicBySlug(a.topic)!.name}`, title: a.title } })),
  ];
};

export const GET: APIRoute = async ({ props, site }) => {
  const { kicker, title } = props as { kicker: string; title: string };
  const png = await renderArticleCard({ kicker, title, siteHost: site?.host ?? "linuxstatistics.com" });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
