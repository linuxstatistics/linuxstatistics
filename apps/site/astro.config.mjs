import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { NOINDEX_PATHS } from "./src/config/noindex.js";

const site = process.env.SITE_URL ?? "https://linuxstatistics.com";
const apiTarget = process.env.API_URL ?? "http://localhost:3001";

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
      filter: (page) => !page.includes("/admin/") && !page.includes("/pick/match/") && !NOINDEX_PATHS.some((p) => page.endsWith(p)),
      // Every page is rebuilt from fresh data on each build, so the build date is each page's real lastmod.
      serialize: (item) => ({ ...item, lastmod: new Date().toISOString() }),
    }),
  ],
  server: { port: 4380, host: "localhost" },
  vite: {
    server: {
      proxy: { "/api": { target: apiTarget, changeOrigin: false } },
    },
  },
});
