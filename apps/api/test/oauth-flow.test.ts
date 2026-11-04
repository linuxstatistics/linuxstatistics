import { expect, test, vi } from "vitest";
import { buildProviderRegistry } from "../src/lib/oauth/providers.js";
import { exchangeCode, fetchProfile } from "../src/lib/oauth/flow.js";

const reg = buildProviderRegistry({
  GITHUB_OAUTH_CLIENT_ID: "id",
  GITHUB_OAUTH_CLIENT_SECRET: "secret",
} as NodeJS.ProcessEnv);
const github = reg.get("github")!;

test("exchangeCode posts to the token URL and returns the access token", async () => {
  const fetchImpl = vi.fn(async () =>
    new Response(JSON.stringify({ access_token: "tok_123" }), { status: 200 }),
  ) as unknown as typeof fetch;
  const token = await exchangeCode(github, "code_abc", "http://cb", fetchImpl);
  expect(token).toBe("tok_123");
  expect((fetchImpl as any).mock.calls[0][0]).toBe(github.tokenUrl);
});

test("exchangeCode throws when no access_token is returned", async () => {
  const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: "bad" }), { status: 400 })) as unknown as typeof fetch;
  await expect(exchangeCode(github, "x", "http://cb", fetchImpl)).rejects.toThrow(/token exchange failed for github/);
});

test("fetchProfile maps the userinfo response via the provider mapper", async () => {
  const fetchImpl = vi.fn(async () =>
    new Response(JSON.stringify({ id: 5, login: "octo", avatar_url: "a", created_at: "2015-01-01T00:00:00Z" }), { status: 200 }),
  ) as unknown as typeof fetch;
  const profile = await fetchProfile(github, "tok", fetchImpl);
  expect(profile).toMatchObject({ provider: "github", providerUserId: "5", username: "octo" });
  expect(profile.accountCreatedAt).toBeInstanceOf(Date);
});
