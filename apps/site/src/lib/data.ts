import type {
  DistroDetail,
  DistroListItem,
  MarketSharePoint,
  Meta,
} from "@linux-statistics/shared";

/**
 * Build-time data access. Pages read from the Fastify API (never the database
 * directly) so the build works against any environment. Set API_URL to point
 * the build at a running API.
 */
const API_URL = (process.env.API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const cache = new Map<string, Promise<unknown>>();

async function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = (async () => {
      const res = await fetch(`${API_URL}${path}`);
      if (!res.ok) throw new Error(`Build data: GET ${path} -> ${res.status} (API_URL=${API_URL})`);
      return (await res.json()) as T;
    })();
    cache.set(path, p);
  }
  return p;
}

export const loadDistros = () => getJson<DistroListItem[]>("/api/distros");
export const loadMarketShare = () =>
  getJson<MarketSharePoint[]>("/api/market-share?region=global");
export const loadMeta = () => getJson<Meta>("/api/meta");
export const loadRising = () => getJson<DistroListItem[]>("/api/rising");
export const loadDistro = (slug: string) =>
  getJson<DistroDetail>(`/api/distros/${encodeURIComponent(slug)}`);

/** Run tasks with a small concurrency limit (keeps the API calm during builds). */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Latest successful capture for a source, for "data as of" lines. */
export function dataDate(meta: Meta, source: Meta["sources"][number]["source"]): string | null {
  const s = meta.sources.find((x) => x.source === source);
  return s?.lastSuccessAt ? s.lastSuccessAt.slice(0, 10) : null;
}
