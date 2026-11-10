import { expect, test } from "vitest";
import { databaseUrlFor } from "../src/client.js";

test("production refuses to fall back to the local PGlite folder", () => {
  expect(() => databaseUrlFor({ NODE_ENV: "production" })).toThrow(/DATABASE_URL is required/);
  expect(() => databaseUrlFor({ NODE_ENV: "production", DATABASE_URL: "" })).toThrow(/DATABASE_URL is required/);
});

test("DATABASE_URL picks Postgres; without it, development uses PGlite", () => {
  expect(databaseUrlFor({ NODE_ENV: "production", DATABASE_URL: "postgres://x" })).toBe("postgres://x");
  expect(databaseUrlFor({ NODE_ENV: "development" })).toBeUndefined();
});
