import { expect, test } from "vitest";
import { analyticsFor } from "../src/config/analytics";

test("analytics load only in Vercel production builds", () => {
  expect(analyticsFor({ VERCEL_ENV: "production" }).enabled).toBe(true);
  expect(analyticsFor({ VERCEL_ENV: "preview" }).enabled).toBe(false);
  expect(analyticsFor({}).enabled).toBe(false);
});

test("the script comes from the default path, or the project's base path when Vercel sets one", () => {
  expect(analyticsFor({ VERCEL_ENV: "production" })).toMatchObject({
    scriptSrc: "/_vercel/insights/script.js",
    endpoint: undefined,
    speedScriptSrc: "/_vercel/speed-insights/script.js",
    speedEndpoint: undefined,
  });
  expect(analyticsFor({ VERCEL_ENV: "production", VERCEL_OBSERVABILITY_BASEPATH: "/abc123/" })).toMatchObject({
    scriptSrc: "/abc123/insights/script.js",
    endpoint: "/abc123/insights",
    speedScriptSrc: "/abc123/speed-insights/script.js",
    speedEndpoint: "/abc123/speed-insights/vitals",
  });
});
