import { expect, test } from "vitest";
import { resolveSessionSecret } from "../src/lib/session.js";

test("production refuses to start without SESSION_SECRET", () => {
  expect(() => resolveSessionSecret({ NODE_ENV: "production" })).toThrow(/required in production/);
});

test("development falls back to the dev secret", () => {
  expect(resolveSessionSecret({ NODE_ENV: "development" }).length).toBeGreaterThanOrEqual(32);
});

test("an explicit secret is used as-is", () => {
  const s = "x".repeat(40);
  expect(resolveSessionSecret({ NODE_ENV: "production", SESSION_SECRET: s })).toBe(s);
});
