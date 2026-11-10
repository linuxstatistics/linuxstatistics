import { expect, test } from "vitest";
import { assertSeedAllowed } from "../src/seed.js";

test("the seed refuses to run against production or a Postgres URL", () => {
  expect(() => assertSeedAllowed({ NODE_ENV: "production" })).toThrow(/local PGlite/);
  expect(() => assertSeedAllowed({ DATABASE_URL: "postgres://prod" })).toThrow(/local PGlite/);
  expect(() => assertSeedAllowed({ NODE_ENV: "production", DATABASE_URL: "postgres://x", ALLOW_SEED_POSTGRES: "1" })).toThrow();
});

test("the seed runs on local PGlite, or a local Postgres when allowed", () => {
  expect(() => assertSeedAllowed({})).not.toThrow();
  expect(() => assertSeedAllowed({ DATABASE_URL: "postgres://localhost", ALLOW_SEED_POSTGRES: "1" })).not.toThrow();
});
