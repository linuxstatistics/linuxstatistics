import { politeGet, USER_AGENT, type FetchLike } from "./http.js";

/**
 * IndexNow: tells Bing, Yandex, Seznam and Naver which URLs changed (Google doesn't
 * take part; it reads the sitemap). The key is public by design and is served as
 * /<key>.txt from apps/site/public.
 */
export const INDEXNOW_KEY = "2a21d604a5493b3ff4c1a8657810d06d";
const ENDPOINT = "https://api.indexnow.org/indexnow";
/** The protocol's per-request limit. */
const MAX_URLS = 10_000;

/** Page URLs from a sitemap index and its child sitemaps, only on `host`. */
export async function sitemapUrls(site: string, opts: { fetch?: FetchLike } = {}): Promise<string[]> {
  const host = new URL(site).host;
  const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.trim());
  const index = await (await politeGet(new URL("/sitemap-index.xml", site).href, opts)).text();
  const urls: string[] = [];
  for (const child of locs(index)) {
    if (new URL(child).host !== host) continue;
    urls.push(...locs(await (await politeGet(child, opts)).text()));
  }
  return [...new Set(urls.filter((u) => new URL(u).host === host))];
}

/** Submit URLs in batches. Returns how many were accepted (HTTP 200 or 202). */
export async function submitIndexNow(site: string, urls: string[], opts: { fetch?: FetchLike } = {}): Promise<number> {
  const doFetch = opts.fetch ?? fetch;
  const host = new URL(site).host;
  let sent = 0;
  for (let i = 0; i < urls.length; i += MAX_URLS) {
    const batch = urls.slice(i, i + MAX_URLS);
    const res = await doFetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", "User-Agent": USER_AGENT },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: new URL(`/${INDEXNOW_KEY}.txt`, site).href, urlList: batch }),
    });
    if (res.status !== 200 && res.status !== 202) throw new Error(`IndexNow answered ${res.status}`);
    sent += batch.length;
  }
  return sent;
}

async function main(): Promise<void> {
  const site = process.env.SITE_URL ?? "https://linuxstatistics.com";
  const urls = await sitemapUrls(site);
  const sent = await submitIndexNow(site, urls);
  console.log(`IndexNow: submitted ${sent} URLs for ${new URL(site).host}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
