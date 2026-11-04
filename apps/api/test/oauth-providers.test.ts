import { expect, test } from "vitest";
import {
  buildProviderRegistry,
  authorizeRedirect,
} from "../src/lib/oauth/providers.js";

const ENV = {
  GITHUB_OAUTH_CLIENT_ID: "gh_id",
  GITHUB_OAUTH_CLIENT_SECRET: "gh_secret",
  GITLAB_OAUTH_CLIENT_ID: "gl_id",
  GITLAB_OAUTH_CLIENT_SECRET: "gl_secret",
} as NodeJS.ProcessEnv;

test("registry includes only providers with both id and secret", () => {
  const reg = buildProviderRegistry(ENV);
  expect([...reg.keys()].sort()).toEqual(["github", "gitlab"]);
  expect(reg.has("codeberg")).toBe(false);
});

test("authorizeRedirect builds a correct authorize URL", () => {
  const reg = buildProviderRegistry(ENV);
  const url = new URL(authorizeRedirect(reg.get("github")!, "http://localhost:3001/api/auth/github/callback", "xyz"));
  expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
  expect(url.searchParams.get("client_id")).toBe("gh_id");
  expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3001/api/auth/github/callback");
  expect(url.searchParams.get("scope")).toBe("read:user");
  expect(url.searchParams.get("state")).toBe("xyz");
  expect(url.searchParams.get("response_type")).toBe("code");
});

test("each provider maps its forge JSON to a normalized profile", () => {
  const reg = buildProviderRegistry({
    ...ENV,
    CODEBERG_OAUTH_CLIENT_ID: "cb_id",
    CODEBERG_OAUTH_CLIENT_SECRET: "cb_secret",
  } as NodeJS.ProcessEnv);
  expect(reg.get("github")!.mapProfile({ id: 7, login: "octocat", avatar_url: "a", created_at: "2015-01-01T00:00:00Z" }))
    .toMatchObject({ provider: "github", providerUserId: "7", username: "octocat", avatarUrl: "a" });
  expect(reg.get("gitlab")!.mapProfile({ id: 9, username: "gluser", avatar_url: null, created_at: "2016-01-01T00:00:00Z" }))
    .toMatchObject({ provider: "gitlab", providerUserId: "9", username: "gluser", avatarUrl: null });
  expect(reg.get("codeberg")!.mapProfile({ id: 3, login: "cbuser", avatar_url: "c", created: "2017-01-01T00:00:00Z" }))
    .toMatchObject({ provider: "codeberg", providerUserId: "3", username: "cbuser", avatarUrl: "c" });
});
