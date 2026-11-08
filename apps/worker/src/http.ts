export const USER_AGENT = "linux-statistics-bot/0.1 (+https://linuxstatistics.com/bot/)";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** HTTP status that should stop a run instead of retrying (polite collection). */
export class StopError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET with a real User-Agent. Retries 5xx and network errors with backoff;
 * stops at once on 403/429 (we never rotate agents or hammer a source).
 */
export async function politeGet(
  url: string,
  opts: { fetch?: FetchLike; headers?: Record<string, string>; retries?: number; backoffMs?: number } = {},
): Promise<Response> {
  const doFetch = opts.fetch ?? fetch;
  const retries = opts.retries ?? 2;
  const backoff = opts.backoffMs ?? 2000;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await doFetch(url, { headers: { "User-Agent": USER_AGENT, ...opts.headers } });
      if (res.status === 403 || res.status === 429) {
        throw new StopError(`${new URL(url).host} answered ${res.status}; stopping (no retry)`);
      }
      if (res.status >= 500) throw new Error(`${new URL(url).host} HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (err instanceof StopError) throw err;
      lastErr = err;
      if (attempt < retries) await sleep(backoff * 2 ** attempt);
    }
  }
  throw lastErr;
}
