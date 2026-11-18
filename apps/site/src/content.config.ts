import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { articleFrontmatter, draftsEnabled } from "./lib/articles";

/** Published articles live in the repo. */
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: articleFrontmatter,
});

/**
 * Drafts live outside the repo (ARTICLE_DRAFTS_DIR) and load only on the dev
 * server. A production build gets an empty collection, even with the
 * variable set.
 */
const dir = process.env.ARTICLE_DRAFTS_DIR;
const drafts = defineCollection({
  loader: draftsEnabled(import.meta.env.DEV, dir) ? glob({ pattern: ["**/*.md", "!**/README.md", "!_templates/**", "!**/_*.md"], base: dir! }) : { name: "no-drafts", load: async () => {} },
  schema: articleFrontmatter,
});

export const collections = { articles, drafts };
