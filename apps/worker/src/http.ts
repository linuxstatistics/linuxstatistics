export const USER_AGENT = "linux-statistics-bot/0.1 (+https://linuxstatistics.com/bot/)";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** HTTP status that should stop a run instead of retrying (polite collection). */
export class StopError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET with a real User-Agent. Retries 5xx and network errors with backoff;
 * stops at once on 403/429 (we never rotate agents or hammer a source).
 */
/**
 * A 403 that is about the request itself, not about us: GitHub answers 403 for
 * "contributor list too large" on huge repositories. Those are returned to the
 * caller like any other error status; a rate-limit 403 still stops the run.
 */
async function isPlainForbidden(res: Response): Promise<boolean> {
  if (res.headers.get("x-ratelimit-remaining") === "0") return false;
  try {
    const body = (await res.clone().json()) as { message?: unknown };
    return typeof body.message === "string" && /too large to list/i.test(body.message);
  } catch {
    return false;
  }
}

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
      if (res.status === 429 || (res.status === 403 && !(await isPlainForbidden(res)))) {
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
