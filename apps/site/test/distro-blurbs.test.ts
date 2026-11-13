import { expect, test } from "vitest";
import { DISTRO_BLURBS } from "../src/lib/distro-blurbs";
import { PROFILES } from "../src/lib/picker-profiles";

test("curated blurbs are short, sourced and free of em dashes", () => {
  for (const [slug, b] of Object.entries(DISTRO_BLURBS)) {
    const words = b.text.split(/\s+/).length;
    expect(words, slug).toBeGreaterThanOrEqual(15);
    expect(words, slug).toBeLessThanOrEqual(60);
    expect(b.text, slug).not.toMatch(/\u2014/);
    expect(b.source, slug).toMatch(/^https:\/\//);
  }
});

test("blurbs don't duplicate quiz profiles, which take precedence", () => {
  const keys = new Set(PROFILES.map((p) => p.key));
  for (const slug of Object.keys(DISTRO_BLURBS)) expect(keys.has(slug), slug).toBe(false);
});
