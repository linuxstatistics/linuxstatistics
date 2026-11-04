import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    include: ["packages/**/test/**/*.test.ts", "apps/**/test/**/*.test.{ts,tsx}"],
    pool: "forks",
    environmentMatchGlobs: [["apps/web/**", "jsdom"]],
  },
});
