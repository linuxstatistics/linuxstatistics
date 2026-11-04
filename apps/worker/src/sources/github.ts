/** Subset of the GitHub REST repo response we consume. */
export interface GithubRepoResponse {
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface MappedRepo {
  repoFullName: string;
  stars: number;
  forks: number;
  openIssues: number;
}

/** Map a GitHub repo API response to our repo shape. */
export function mapGithubRepo(r: GithubRepoResponse): MappedRepo {
  if (!r.full_name || !/^[^/]+\/[^/]+$/.test(r.full_name)) {
    throw new Error(`GitHub repo response has an invalid full_name: ${r.full_name}`);
  }
  return {
    repoFullName: r.full_name,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    openIssues: r.open_issues_count ?? 0,
  };
}
