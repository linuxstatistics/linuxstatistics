import { expect, test } from "vitest";
import { DESKTOPS } from "@linux-statistics/shared";
import { DESKTOP_PAGES, DESKTOP_PAIRS, desktopPage, pageForDesktop, pairSlug } from "../src/lib/desktops";
import { distrosFor } from "../src/lib/desktop-distros";
import { desktopHref, factSentences } from "../src/lib/desktop-links";

test("pages have unique slugs, known desktop IDs and sources; each ID has at most one page", () => {
  expect(new Set(DESKTOP_PAGES.map((p) => p.slug)).size).toBe(DESKTOP_PAGES.length);
  const seen = new Set<string>();
  for (const p of DESKTOP_PAGES) {
    expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    expect(p.sources.length, p.slug).toBeGreaterThan(0);
    for (const id of p.ids) {
      expect(DESKTOPS).toContain(id);
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
    }
  }
});

test("comparison pairs point at existing pages and don't clash with page slugs", () => {
  for (const x of DESKTOP_PAIRS) {
    expect(desktopPage(x.a), x.a).toBeDefined();
    expect(desktopPage(x.b), x.b).toBeDefined();
    expect(desktopPage(pairSlug(x))).toBeUndefined();
    expect(x.faq.length).toBeGreaterThanOrEqual(3);
  }
});

test("distros are split into default and offered, best ranked first, never both", () => {
  const list = [
    { slug: "b", name: "B", rank: 5, defaultDesktop: "gnome" as const, otherDesktops: [] },
    { slug: "a", name: "A", rank: 1, defaultDesktop: "gnome" as const, otherDesktops: ["kde-plasma" as const] },
    { slug: "c", name: "C", rank: null, defaultDesktop: null, otherDesktops: ["gnome" as const] },
    { slug: "d", name: "D", rank: 2, defaultDesktop: "xfce" as const, otherDesktops: [] },
  ];
  const g = distrosFor(desktopPage("gnome")!, list);
  expect(g.byDefault.map((d) => d.slug)).toEqual(["a", "b"]);
  expect(g.offered.map((d) => d.slug)).toEqual(["c"]);
  expect(distrosFor(desktopPage("kde-plasma")!, list).offered.map((d) => d.slug)).toEqual(["a"]);
});

test("desktop links prefer the desktop page, then the glossary", () => {
  expect(desktopHref("gnome")).toBe("/desktop/gnome/");
  expect(desktopHref("hyprland")).toBe("/desktop/window-managers/");
  expect(pageForDesktop("pantheon")).toBeUndefined();
  expect(desktopHref("pantheon")).toBeUndefined();
});

test("fact sentences name the default, the alternatives and flavours", () => {
  const facts = { defaultDesktop: "gnome" as const, otherDesktops: [], editions: [{ desktop: "kde-plasma" as const, slug: "kubuntu" }], packageManager: "apt" as const, init: "systemd" as const, sourceUrl: null, fieldSources: {} };
  expect(factSentences("Ubuntu", facts, (s) => (s === "kubuntu" ? "Kubuntu" : undefined))).toEqual([
    "Ubuntu ships with the GNOME desktop by default; KDE Plasma (as Kubuntu) is also offered.",
    "Ubuntu installs software with APT and starts with systemd.",
  ]);
  expect(factSentences("Endeavour", { ...facts, defaultDesktop: null, otherDesktops: ["kde-plasma", "gnome"], editions: [] }, () => undefined)[0]).toBe(
    "Endeavour has no single default desktop; you choose from KDE Plasma and GNOME.",
  );
});
