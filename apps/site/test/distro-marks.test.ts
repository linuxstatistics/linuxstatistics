import { expect, test } from "vitest";
import * as icons from "simple-icons";
import { DISTRO_MARKS, luminance, markStyle, monogram } from "../src/lib/distro-marks";
import { MARKS_DIR, markDataUri } from "@linux-statistics/shared/marks-node";

const bySlug = new Map(Object.values(icons).map((i) => [i.slug, i]));

test("every manifest entry exists in simple-icons with the recorded title and source", () => {
  for (const [slug, m] of Object.entries(DISTRO_MARKS)) {
    const icon = bySlug.get(m.icon);
    expect(icon, slug).toBeDefined();
    expect(icon?.title, slug).toBe(m.title);
    expect(m.source, slug).toMatch(/^https?:\/\//);
    expect(m.hex, slug).toMatch(/^[0-9A-F]{6}$/);
  }
});

test("glyph colour contrasts with the tile", () => {
  expect(markStyle("slackware")).toEqual({ bg: "#000000", fg: "#fff" });
  expect(markStyle("openbsd")?.fg).toBe("#111");
  expect(markStyle("no-such-distro")).toBeNull();
  expect(luminance("FFFFFF")).toBeCloseTo(1);
});

test("monogram takes the first letter or digit", () => {
  expect(monogram("elementary")).toBe("E");
  expect(monogram("<<Hack|Track")).toBe("H");
  expect(monogram("4MLinux")).toBe("4");
  expect(monogram("—")).toBe("?");
});

test("sprite content is path data only (nothing that could run)", () => {
  for (const m of Object.values(DISTRO_MARKS)) {
    expect(bySlug.get(m.icon)?.path, m.icon).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]+$/);
  }
});

test("full-colour icons exist, are credited, and never shadow a simple-icons mark", async () => {
  const { DISTRO_IMAGES } = await import("../src/lib/distro-marks");
  const { existsSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  for (const [slug, img] of Object.entries(DISTRO_IMAGES)) {
    expect(DISTRO_MARKS[slug], slug).toBeUndefined();
    expect(img.file, slug).toMatch(/^[a-z0-9-]+\.png$/);
    expect(existsSync(resolve(MARKS_DIR, img.file)), slug).toBe(true);
    expect(img.source, slug).toMatch(/^https?:\/\//);
    if (img.license.startsWith("Trademark")) expect(img.author, slug).toMatch(/project \((Official website icon|GitHub organization avatar)\)$/);
    else expect(img.source, slug).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(img.license.length, slug).toBeGreaterThan(2);
    expect(img.author.length, slug).toBeGreaterThan(2);
  }
});

test("share cards get a data URI per mark, null for monograms", () => {
  expect(markDataUri("arch")).toMatch(/^data:image\/svg\+xml;utf8,/);
  expect(decodeURIComponent(markDataUri("arch")!)).toContain('fill="#1793D1"');
  expect(markDataUri("puppy")).toMatch(/^data:image\/png;base64,iVBOR/);
  expect(markDataUri("no-such-distro")).toBeNull();
});

test("every PNG in the marks folder is listed in the manifest", async () => {
  const { DISTRO_IMAGES } = await import("../src/lib/distro-marks");
  const { readdirSync } = await import("node:fs");
  const listed = new Set(Object.values(DISTRO_IMAGES).map((m) => m.file));
  expect(readdirSync(MARKS_DIR).filter((f) => f.endsWith(".png")).filter((f) => !listed.has(f))).toEqual([]);
});
