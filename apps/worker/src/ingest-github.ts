import { findDistroIdBySlug, replaceGithubRepo, type Database } from "@linux-statistics/db";
import { mapGithubRepo, type GithubRepoResponse } from "./sources/github.js";
import { politeGet, StopError, type FetchLike } from "./http.js";
import { GITHUB_REPOS } from "./github-repos.js";

/** Count items from a paginated GitHub list using per_page=1 and the "last" link. */
async function countViaLink(url: string, get: (u: string) => Promise<Response>): Promise<number> {
  const res = await get(url);
  if (res.status === 409) return 0; // empty repository
  if (!res.ok) throw new Error(`GitHub ${url} -> ${res.status}`);
  const link = res.headers.get("link") ?? "";
  const last = /[?&]page=(\d+)>; rel="last"/.exec(link);
  if (last) return Number(last[1]);
  const body = (await res.json()) as unknown[];
  return Array.isArray(body) ? body.length : 0;
}

export interface GithubIngestResult {
  written: number;
  failed: { repo: string; error: string }[];
}

/**
 * For each curated repo: stars/forks/issues, commits in the last 30 days and
 * contributor count. One failing repo is recorded and skipped; a 403/429 stops
 * the whole run (rate limit) without writing partial snapshots for that repo.
 */
export async function ingestGithub(
  db: Database,
  opts: { fetch?: FetchLike; now?: Date; token?: string } = {},
): Promise<GithubIngestResult> {
  const now = opts.now ?? new Date();
  const since = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = opts.token ?? process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const get = (u: string) => politeGet(u, { fetch: opts.fetch, headers, retries: 1, backoffMs: 1000 });

  const result: GithubIngestResult = { written: 0, failed: [] };
  for (const { key, repo } of GITHUB_REPOS) {
    try {
      const distroId = await findDistroIdBySlug(db, key);
      if (!distroId) continue; // distro not ingested yet
      const res = await get(`https://api.github.com/repos/${repo}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const mapped = mapGithubRepo((await res.json()) as GithubRepoResponse);
      const commits = await countViaLink(
        `https://api.github.com/repos/${mapped.repoFullName}/commits?since=${since}&per_page=1`,
        get,
      );
      const contributors = await countViaLink(
        `https://api.github.com/repos/${mapped.repoFullName}/contributors?per_page=1&anon=true`,
        get,
      );
      await replaceGithubRepo(db, distroId, mapped, { capturedAt: now, commitsLast30d: commits, contributors });
      result.written += 1;
    } catch (err) {
      if (err instanceof StopError) throw err;
      result.failed.push({ repo, error: String(err instanceof Error ? err.message : err) });
    }
  }
  return result;
}
