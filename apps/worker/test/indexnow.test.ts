import { expect, test } from "vitest";
import { INDEXNOW_KEY, sitemapUrls, submitIndexNow } from "../src/indexnow.js";
import type { FetchLike } from "../src/http.js";

const SITE = "https://example.org";

test("collects page URLs from the sitemap index, own host only", async () => {
  const pages: Record<string, string> = {
    "https://example.org/sitemap-index.xml": "<sitemapindex><sitemap><loc>https://example.org/sitemap-0.xml</loc></sitemap><sitemap><loc>https://other.example/s.xml</loc></sitemap></sitemapindex>",
    "https://example.org/sitemap-0.xml": "<urlset><url><loc>https://example.org/</loc></url><url><loc>https://example.org/pick/</loc></url><url><loc>https://example.org/</loc></url><url><loc>https://elsewhere.example/x</loc></url></urlset>",
  };
  const fake: FetchLike = async (url) => (pages[url] ? new Response(pages[url]) : new Response("", { status: 404 }));
  expect(await sitemapUrls(SITE, { fetch: fake })).toEqual(["https://example.org/", "https://example.org/pick/"]);
});

test("submits host, key, key location and URLs; fails loudly on a rejected key", async () => {
  const bodies: unknown[] = [];
  const ok: FetchLike = async (_url, init) => {
    bodies.push(JSON.parse(String(init?.body)));
    return new Response(null, { status: 202 });
  };
  expect(await submitIndexNow(SITE, ["https://example.org/"], { fetch: ok })).toBe(1);
  expect(bodies[0]).toEqual({ host: "example.org", key: INDEXNOW_KEY, keyLocation: `https://example.org/${INDEXNOW_KEY}.txt`, urlList: ["https://example.org/"] });
  const rejected: FetchLike = async () => new Response(null, { status: 403 });
  await expect(submitIndexNow(SITE, ["https://example.org/"], { fetch: rejected })).rejects.toThrow("403");
});
