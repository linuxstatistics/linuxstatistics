import { expect, test } from "vitest";
import { articleFrontmatter, draftsEnabled, readingMinutes, relatedArticles, sortArticles, type ArticleCard } from "../src/lib/articles";

const card = (slug: string, published: string, tags: string[], draft = false): ArticleCard => ({
  slug, title: slug, description: "x".repeat(30), published: new Date(published), tags, minutes: 3, draft,
});

test("drafts load only on the dev server with a drafts folder set", () => {
  expect(draftsEnabled(true, "/tmp/drafts")).toBe(true);
  expect(draftsEnabled(false, "/tmp/drafts")).toBe(false);
  expect(draftsEnabled(true, undefined)).toBe(false);
  expect(draftsEnabled(true, " ")).toBe(false);
});

test("front matter needs a title, description, date and a tag", () => {
  expect(articleFrontmatter.safeParse({ title: "How we rank", description: "The four signals behind the index.", published: "2026-11-15", tags: ["Method"] }).success).toBe(true);
  expect(articleFrontmatter.safeParse({ title: "How we rank", description: "Short", published: "2026-11-15", tags: ["Method"] }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ title: "How we rank", description: "The four signals behind the index.", published: "2026-11-15", tags: [] }).success).toBe(false);
});

test("reading time rounds words at about 220 a minute, at least one", () => {
  expect(readingMinutes("word ".repeat(10))).toBe(1);
  expect(readingMinutes("word ".repeat(1320))).toBe(6);
});

test("newest first", () => {
  expect(sortArticles([card("a", "2026-01-01", ["x"]), card("b", "2026-06-01", ["x"])]).map((a) => a.slug)).toEqual(["b", "a"]);
});

test("related: shared tags first, and published articles never link to drafts", () => {
  const all = [card("cur", "2026-05-01", ["Method"]), card("m", "2026-01-01", ["Method"]), card("d", "2026-04-01", ["Data"]), card("draft", "2026-06-01", ["Method"], true)];
  expect(relatedArticles(all[0]!, all).map((a) => a.slug)).toEqual(["m", "d"]);
  expect(relatedArticles(card("x", "2026-07-01", ["Method"], true), all).map((a) => a.slug)).toContain("draft");
});

test("external links in an article open in a new tab; our own and relative links don't", async () => {
  const { externalLinksNewTab } = await import("../src/lib/articles");
  const out = externalLinksNewTab('<a href="https://popcon.debian.org/">a</a> <a href="/about/">b</a> <a href="https://linuxstatistics.com/data/">c</a>');
  expect(out).toContain('<a href="https://popcon.debian.org/" target="_blank" rel="noopener noreferrer"');
  expect(out).toContain('<a href="/about/">b</a>');
  expect(out).toContain('<a href="https://linuxstatistics.com/data/">c</a>');
});
