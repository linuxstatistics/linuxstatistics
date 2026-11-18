import type { APIRoute } from "astro";
import { loadArticles } from "../../lib/article-entries";

/** Published guides and when their steps were checked; read by check-site.sh to warn about stale guides. */
export const GET: APIRoute = async () => {
  const guides = (await loadArticles())
    .map((a) => a.card)
    .filter((a) => !a.draft && a.type === "guide" && a.checked)
    .map((a) => ({ slug: a.slug, checked: a.checked!.toISOString().slice(0, 10) }));
  return new Response(JSON.stringify(guides), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
