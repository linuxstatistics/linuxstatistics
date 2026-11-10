import { expect, test } from "vitest";
import { databaseUrlFor, isPooledUrl } from "../src/client.js";

test("pooled (PgBouncer) URLs are recognised so prepared statements can be turned off", () => {
  expect(isPooledUrl("postgresql://u:p@ep-x-123-pooler.us-east-1.aws.neon.tech/db?sslmode=require")).toBe(true);
  expect(isPooledUrl("postgresql://u:p@ep-x-123.us-east-1.aws.neon.tech/db?sslmode=require")).toBe(false);
  expect(isPooledUrl("not a url")).toBe(false);
});

test("production refuses to fall back to the local PGlite folder", () => {
  expect(() => databaseUrlFor({ NODE_ENV: "production" })).toThrow(/DATABASE_URL is required/);
  expect(() => databaseUrlFor({ NODE_ENV: "production", DATABASE_URL: "" })).toThrow(/DATABASE_URL is required/);
});

test("DATABASE_URL picks Postgres; without it, development uses PGlite", () => {
  expect(databaseUrlFor({ NODE_ENV: "production", DATABASE_URL: "postgres://x" })).toBe("postgres://x");
  expect(databaseUrlFor({ NODE_ENV: "development" })).toBeUndefined();
});
