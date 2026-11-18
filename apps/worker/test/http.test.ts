import { expect, test } from "vitest";
import { politeGet, reasonOf, StopError } from "../src/http.js";

const gh = (status: number, message: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ message }), { status, headers: { "content-type": "application/json", "x-ratelimit-remaining": "4000", ...headers } });

test("a GitHub 403 about one repository comes back to the caller with its reason", async () => {
  for (const msg of [
    "The history or contributor list is too large to list contributors for this repository via the API.",
    "Resource not accessible by personal access token",
    "Although you appear to have the correct authorization credentials, the `org` organization has enabled OAuth App access restrictions.",
  ]) {
    const r = await politeGet("https://api.github.com/repos/o/r/contributors", { fetch: async () => gh(403, msg) });
    expect(r.status).toBe(403);
    expect(await reasonOf(r)).toBe(msg.split("\n")[0]);
  }
});

test("rate limits stop the run, and the error says why", async () => {
  await expect(politeGet("https://api.github.com/x", { fetch: async () => gh(403, "API rate limit exceeded for user", { "x-ratelimit-remaining": "0" }) })).rejects.toThrow(/403 \(API rate limit exceeded for user\); stopping/);
  await expect(politeGet("https://api.github.com/x", { fetch: async () => gh(403, "You have exceeded a secondary rate limit") })).rejects.toBeInstanceOf(StopError);
  await expect(politeGet("https://api.github.com/x", { fetch: async () => gh(403, "anything", { "retry-after": "60" }) })).rejects.toBeInstanceOf(StopError);
  await expect(politeGet("https://api.github.com/x", { fetch: async () => gh(429, "slow down") })).rejects.toBeInstanceOf(StopError);
});

test("a 403 from a site without GitHub's rate-limit headers still stops the run", async () => {
  await expect(politeGet("https://distrowatch.com/", { fetch: async () => new Response("Forbidden", { status: 403 }) })).rejects.toBeInstanceOf(StopError);
});
