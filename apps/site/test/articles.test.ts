import { expect, test } from "vitest";
import { articleFrontmatter, draftsEnabled, groupByTopic, hubArticles, isHubLive, publishedCount, readingMinutes, relatedArticles, sortArticles, staleGuides, thinHubPaths, type ArticleCard } from "../src/lib/articles";

const card = (slug: string, published: string, topic: ArticleCard["topic"] = "data", o: Partial<ArticleCard> = {}): ArticleCard => ({
  slug, title: slug, description: "x".repeat(30), published: new Date(published), topic, alsoIn: [], type: "analysis", distros: [], minutes: 3, draft: false, ...o,
});
const base = { title: "How we rank", description: "The four signals behind the index.", published: "2026-11-15", topic: "data", type: "analysis" };
const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

test("drafts load only on the dev server with a drafts folder set", () => {
  expect(draftsEnabled(true, "/tmp/drafts")).toBe(true);
  expect(draftsEnabled(false, "/tmp/drafts")).toBe(false);
  expect(draftsEnabled(true, undefined)).toBe(false);
  expect(draftsEnabled(true, " ")).toBe(false);
});

test("front matter needs a known topic and type; tags are gone", () => {
  expect(articleFrontmatter.safeParse(base).success).toBe(true);
  expect(articleFrontmatter.safeParse({ ...base, description: "Short" }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...base, topic: "cooking" }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...base, type: "news" }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...base, tags: ["Method"] }).success).toBe(false);
});

test("alsoIn: up to two other topics, never the main one or a repeat", () => {
  expect(articleFrontmatter.safeParse({ ...base, alsoIn: ["gaming", "hardware"] }).success).toBe(true);
  expect(articleFrontmatter.safeParse({ ...base, alsoIn: ["gaming", "hardware", "privacy"] }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...base, alsoIn: ["data"] }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...base, alsoIn: ["gaming", "gaming"] }).success).toBe(false);
});

test("Q&A needs a question and a 40 to 60 word answer; other types may not have them", () => {
  const qa = { ...base, type: "qa", question: "Which Linux distros have no telemetry?" };
  expect(articleFrontmatter.safeParse({ ...qa, answer: words(50) }).success).toBe(true);
  expect(articleFrontmatter.safeParse({ ...qa, answer: words(39) }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...qa, answer: words(61) }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...qa, question: undefined, answer: words(50) }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...base, question: "Why?", answer: words(50) }).success).toBe(false);
});

test("guides need a checked date", () => {
  expect(articleFrontmatter.safeParse({ ...base, type: "guide" }).success).toBe(false);
  expect(articleFrontmatter.safeParse({ ...base, type: "guide", checked: "2026-11-17" }).success).toBe(true);
});

test("reading time rounds words at about 220 a minute, at least one", () => {
  expect(readingMinutes("word ".repeat(10))).toBe(1);
  expect(readingMinutes("word ".repeat(1320))).toBe(6);
});

test("newest first", () => {
  expect(sortArticles([card("a", "2026-01-01"), card("b", "2026-06-01")]).map((a) => a.slug)).toEqual(["b", "a"]);
});

test("related: same topic first, then shared distros, then newest; published never links to drafts", () => {
  const cur = card("cur", "2026-05-01", "gaming", { distros: ["bazzite"] });
  const all = [
    cur,
    card("other-new", "2026-09-01", "privacy"),
    card("other-bazzite", "2026-02-01", "data", { distros: ["bazzite"] }),
    card("same-old", "2026-01-01", "gaming"),
    card("draft", "2026-06-01", "gaming", { draft: true }),
  ];
  expect(relatedArticles(cur, all).map((a) => a.slug)).toEqual(["same-old", "other-bazzite", "other-new"]);
  expect(relatedArticles(card("x", "2026-07-01", "gaming", { draft: true }), all).map((a) => a.slug)).toContain("draft");
});

test("a hub goes live at 3 published articles (main or alsoIn); drafts never count", () => {
  const cards = [
    card("a", "2026-01-01", "gaming"),
    card("b", "2026-01-02", "hardware", { alsoIn: ["gaming"] }),
    card("c", "2026-01-03", "gaming", { draft: true }),
  ];
  expect(publishedCount(cards, "gaming")).toBe(2);
  expect(isHubLive(cards, "gaming")).toBe(false);
  expect(isHubLive([...cards, card("d", "2026-01-04", "gaming")], "gaming")).toBe(true);
  expect(thinHubPaths(cards)).toContain("/articles/gaming/");
  expect(hubArticles(cards, "gaming").map((a) => a.slug)).toEqual(["c", "b", "a"]);
});

test("the index lists each article once, under its main topic, in topic order", () => {
  const g = groupByTopic([card("d1", "2026-01-01", "data"), card("g1", "2026-02-01", "gaming", { alsoIn: ["data"] }), card("b1", "2026-03-01", "beginners")]);
  expect(g.map((x) => [x.topic, x.articles.map((a) => a.slug)])).toEqual([["beginners", ["b1"]], ["gaming", ["g1"]], ["data", ["d1"]]]);
});

test("guides older than six months are stale", () => {
  const now = new Date("2026-11-17T00:00:00Z");
  const g = (checked: string) => card(checked, "2026-01-01", "beginners", { type: "guide", checked: new Date(checked) });
  expect(staleGuides([g("2026-04-01"), g("2026-06-01"), card("an", "2026-01-01")], now).map((a) => a.slug)).toEqual(["2026-04-01"]);
});

test("topic slugs are unique and never collide with article slugs", async () => {
  const { ARTICLE_TOPICS } = await import("../src/lib/article-topics");
  const slugs = ARTICLE_TOPICS.map((t) => t.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  const { readdirSync, existsSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const dir = resolve(process.cwd(), "apps/site/src/content/articles");
  const articleSlugs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")) : [];
  for (const s of articleSlugs) expect(slugs, s).not.toContain(s);
  for (const t of ARTICLE_TOPICS) for (const r of t.related) expect(r.href, t.slug).toMatch(/^\//);
});

test("external links in an article open in a new tab; our own and relative links don't", async () => {
  const { externalLinksNewTab } = await import("../src/lib/articles");
  const out = externalLinksNewTab('<a href="https://popcon.debian.org/">a</a> <a href="/about/">b</a> <a href="https://linuxstatistics.com/data/">c</a>');
  expect(out).toContain('<a href="https://popcon.debian.org/" target="_blank" rel="noopener noreferrer"');
  expect(out).toContain('<a href="/about/">b</a>');
  expect(out).toContain('<a href="https://linuxstatistics.com/data/">c</a>');
});

test("noindex.js lists exactly the hubs under MIN_HUB_ARTICLES published articles (run best:noindex to update)", async () => {
  const { NOINDEX_PATHS } = await import("../src/config/noindex.js");
  const { readFrontmatter } = await import("../src/lib/frontmatter");
  const { toCard, readingMinutes } = await import("../src/lib/articles");
  const { readdirSync, readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const dir = resolve(process.cwd(), "apps/site/src/content/articles");
  const cards = readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
    const fm = readFrontmatter(readFileSync(resolve(dir, f), "utf8"))!;
    return toCard(f.replace(/\.md$/, ""), articleFrontmatter.parse(fm.data), readingMinutes(fm.body), false);
  });
  expect([...NOINDEX_PATHS].filter((p) => p.startsWith("/articles/")).sort()).toEqual(thinHubPaths(cards).sort());
});

test("front-matter reader handles quoted strings, dates and arrays", async () => {
  const { readFrontmatter } = await import("../src/lib/frontmatter");
  const fm = readFrontmatter('---\ntitle: "A: b"\npublished: 2026-11-17\nalsoIn: ["gaming", "hardware"]\ntype: qa\n---\nBody text');
  expect(fm?.data).toEqual({ title: "A: b", published: "2026-11-17", alsoIn: ["gaming", "hardware"], type: "qa" });
  expect(fm?.body).toBe("Body text");
  expect(readFrontmatter("no front matter")).toBeNull();
});
