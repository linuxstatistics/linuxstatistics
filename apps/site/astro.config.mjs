import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const site = process.env.SITE_URL ?? "https://linuxstatistics.com";
const apiTarget = process.env.API_URL ?? "http://localhost:3001";

export default defineConfig({
  site,
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [react(), sitemap()],
  server: { port: 4380, host: "localhost" },
  vite: {
    server: {
      proxy: { "/api": { target: apiTarget, changeOrigin: false } },
    },
  },
});
