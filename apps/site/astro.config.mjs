import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { NOINDEX_PATHS } from "./src/config/noindex.js";
import { lastmodFor, loadLastmodContext } from "./src/lib/sitemap-lastmod.ts";

const site = process.env.SITE_URL ?? "https://linuxstatistics.com";
const apiTarget = process.env.API_URL ?? "http://localhost:3001";
/** Loaded once, on the first sitemap entry. */
let lastmodCtx;

export default defineConfig({
  site,
  trailingSlash: "ignore",
  build: { format: "directory" },
  // Astro 7 defaults to "jsx", which drops the space where a line break sits between text and an inline tag.
  compressHTML: true,
  // Fetch a page when the pointer rests on its link, so the click feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [
    react(),
    sitemap({
      // NOINDEX_PATHS lists pages built with a robots noindex (thin /best/ topics); keep them out too.
      filter: (page) => !page.includes("/admin/") && !page.includes("/email/") && !page.includes("/pick/match/") && !NOINDEX_PATHS.some((p) => page.endsWith(p)),
      // lastmod is when the page's content last changed: the data date, an article's date, the policies date.
      // Pages without one get no lastmod rather than the build time.
      serialize: async (item) => {
        lastmodCtx ??= loadLastmodContext(apiTarget, fileURLToPath(new URL("./src/content/articles/", import.meta.url)));
        const lastmod = lastmodFor(item.url, await lastmodCtx);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    // /sitemap.xml is where many crawlers look first: the same index, at that name too.
    {
      name: "sitemap-xml-alias",
      hooks: {
        "astro:build:done": async ({ dir, logger }) => {
          const index = new URL("sitemap-index.xml", dir);
          if (!existsSync(index)) return logger.warn("no sitemap-index.xml to copy to sitemap.xml");
          copyFileSync(index, new URL("sitemap.xml", dir));
          logger.info("`sitemap.xml` copied from sitemap-index.xml");
        },
      },
    },
  ],
  server: { port: 4380, host: "localhost" },
  vite: {
    server: {
      proxy: { "/api": { target: apiTarget, changeOrigin: false } },
    },
  },
});
