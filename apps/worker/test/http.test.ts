import { expect, test } from "vitest";
import { politeGet, StopError } from "../src/http.js";

const res = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

test("a 'too large to list' 403 comes back to the caller instead of stopping the run", async () => {
  const r = await politeGet("https://api.github.com/repos/NixOS/nixpkgs/contributors", {
    fetch: async () => res(403, { message: "The history or contributor list is too large to list contributors for this repository via the API." }),
  });
  expect(r.status).toBe(403);
});

test("a rate-limit 403 and a 429 still stop the run", async () => {
  await expect(politeGet("https://api.github.com/x", { fetch: async () => res(403, { message: "API rate limit exceeded" }, { "x-ratelimit-remaining": "0" }) })).rejects.toBeInstanceOf(StopError);
  await expect(politeGet("https://api.github.com/x", { fetch: async () => res(403, { message: "too large to list" }, { "x-ratelimit-remaining": "0" }) })).rejects.toBeInstanceOf(StopError);
  await expect(politeGet("https://api.github.com/x", { fetch: async () => res(429, {}) })).rejects.toBeInstanceOf(StopError);
  await expect(politeGet("https://example.com/", { fetch: async () => new Response("Forbidden", { status: 403 }) })).rejects.toBeInstanceOf(StopError);
});
