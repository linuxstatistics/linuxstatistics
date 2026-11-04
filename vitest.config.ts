import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    pool: "forks",
    projects: [
      {
        test: {
          name: "node",
          include: ["packages/**/test/**/*.test.ts", "apps/{api,worker}/test/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "site",
          include: ["apps/site/test/**/*.test.{ts,tsx}"],
          environment: "jsdom",
        },
      },
    ],
  },
});
