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
 * A GitHub 403 that is about one repository, not about us: "contributor list
 * too large" on huge repositories, or an organization that refuses this kind
 * of token. GitHub sends rate-limit headers on every API answer; with quota
 * left, no Retry-After and no "rate limit" message, the 403 isn't a rate
 * limit, so it goes back to the caller (that repository is skipped). Any other
 * 403, and every 403 from other sites, still stops the run.
 */
async function isPlainForbidden(res: Response): Promise<boolean> {
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (remaining == null || remaining === "0" || res.headers.has("retry-after")) return false;
  try {
    const body = (await res.clone().json()) as { message?: unknown };
    return typeof body.message === "string" && !/rate limit/i.test(body.message);
  } catch {
    return false;
  }
}

/** GitHub's reason for an error, for logs: the first line of the JSON "message". */
export async function reasonOf(res: Response): Promise<string> {
  try {
    const body = (await res.clone().json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message.split("\n")[0]!.slice(0, 200) : "";
  } catch {
    return "";
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
        const why = await reasonOf(res);
        throw new StopError(`${new URL(url).host} answered ${res.status}${why ? ` (${why})` : ""}; stopping (no retry)`);
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
