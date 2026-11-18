import { expect, test } from "vitest";
import { GLOSSARY, GLOSSARY_GROUPS } from "../src/lib/glossary";
import { definedTermSetNode } from "../src/lib/structured-data";

test("slugs are unique and URL-safe, groups are known, every group has terms", () => {
  expect(new Set(GLOSSARY.map((t) => t.slug)).size).toBe(GLOSSARY.length);
  for (const t of GLOSSARY) expect(t.slug).toMatch(/^[a-z0-9-]+$/);
  const groups = new Set(GLOSSARY_GROUPS.map((g) => g.id));
  for (const t of GLOSSARY) expect(groups.has(t.group), t.slug).toBe(true);
  for (const g of GLOSSARY_GROUPS) expect(GLOSSARY.some((t) => t.group === g.id), g.id).toBe(true);
  expect(GLOSSARY.length).toBeGreaterThanOrEqual(40);
});

test("related terms exist and site links are site paths", () => {
  const slugs = new Set(GLOSSARY.map((t) => t.slug));
  for (const t of GLOSSARY) {
    for (const r of t.related ?? []) expect(slugs.has(r), `${t.slug} → ${r}`).toBe(true);
    for (const s of t.see ?? []) expect(s.href, t.slug).toMatch(/^\/([a-z0-9-]+\/)*$/);
  }
});

test("definitions are plain: no em dashes, the short one is one or two sentences under 200 characters", () => {
  for (const t of GLOSSARY) {
    expect(`${t.short} ${t.more ?? ""}`, t.slug).not.toMatch(/[—–]/);
    expect(t.short.length, t.slug).toBeLessThanOrEqual(200);
    expect(t.short.split(/(?<=\.)\s/).length, t.slug).toBeLessThanOrEqual(2);
  }
});

test("structured data lists every term", () => {
  const set = definedTermSetNode("https://example.com", GLOSSARY);
  expect(set.hasDefinedTerm).toHaveLength(GLOSSARY.length);
  expect(set.hasDefinedTerm[0]).toMatchObject({ "@type": "DefinedTerm", inDefinedTermSet: "https://example.com/glossary/#set" });
});

import { linkGlossaryTerms } from "../src/lib/glossary";

test("links each term once, in paragraphs and list items, never in headings, links or code", () => {
  const html = `<h2>Rolling release</h2><p>A rolling release updates often. Another rolling release.</p><p>Use <code>Flatpak</code> or <a href="/x">Flatpak</a>, then Flatpak.</p><li>Wayland is new.</li>`;
  const out = linkGlossaryTerms(html);
  expect(out).toContain("<h2>Rolling release</h2>");
  expect(out.match(/glossary\/rolling-release\//g)).toHaveLength(1);
  expect(out).toContain("<code>Flatpak</code>");
  expect(out).toContain('<a href="/x">Flatpak</a>');
  expect(out).toContain('then <a href="/glossary/flatpak/" class="term-link">Flatpak</a>.');
  expect(out).toContain('<li><a href="/glossary/wayland/" class="term-link">Wayland</a> is new.</li>');
});

test("respects the per-page limit and skips words inside other words", () => {
  expect(linkGlossaryTerms("<p>snapshots and Snap and ISO</p>", 1).match(/term-link/g)).toHaveLength(1);
  expect(linkGlossaryTerms("<p>snapshotting</p>")).not.toContain("term-link");
});

test("product names link only with their own capitalization", () => {
  expect(linkGlossaryTerms("<p>Windows snap to the edge; wine and cinnamon.</p>")).not.toContain("term-link");
  expect(linkGlossaryTerms("<p>Install it as a Snap.</p>")).toContain('href="/glossary/snap/"');
});
