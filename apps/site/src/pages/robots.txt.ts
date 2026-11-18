import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;
  // /lists/ holds the islands' own data files, not pages or open data.
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /lists/\n\nSitemap: ${sitemap}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
