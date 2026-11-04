import { expect, test } from "vitest";
import { mapGithubRepo } from "../src/sources/github.js";

test("maps a GitHub repo response to our shape", () => {
  const mapped = mapGithubRepo({
    full_name: "linuxmint/cinnamon",
    stargazers_count: 5200,
    forks_count: 800,
    open_issues_count: 120,
  });
  expect(mapped).toEqual({
    repoFullName: "linuxmint/cinnamon",
    stars: 5200,
    forks: 800,
    openIssues: 120,
  });
});

test("throws on an invalid full_name", () => {
  expect(() =>
    mapGithubRepo({
      full_name: "not-a-repo",
      stargazers_count: 1,
      forks_count: 1,
      open_issues_count: 1,
    }),
  ).toThrow(/invalid full_name/);
});
