import { expect, test } from "vitest";
import * as icons from "simple-icons";
import { DISTRO_MARKS, luminance, markStyle, monogram } from "../src/lib/distro-marks";

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
