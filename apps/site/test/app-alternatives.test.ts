import { expect, test } from "vitest";
import { APP_ALTERNATIVES, CATEGORIES, SUPPORT_LABEL, appsFor, bestSupport } from "../src/lib/app-alternatives";

test("unavailable originals do not imply alternatives are bad", () => {
  expect(SUPPORT_LABEL.none).toBe("Not available on Linux");
  expect(APP_ALTERNATIVES.find((a) => a.app === "Adobe InDesign")?.options[0]?.note).toContain("IDML");
});

test("Craft projects appear in matching rows with sources and maturity warnings", () => {
  const pairs = [["Adobe Photoshop", "PhotoCraft"], ["Adobe Lightroom", "LightCraft"], ["Adobe Illustrator", "VectorCraft"], ["Adobe InDesign", "DesignCraft"], ["Adobe Premiere Pro", "FilmCraft"], ["Adobe After Effects", "EffectCraft"], ["Adobe Acrobat", "PdfCraft"]];
  for (const [original, name] of pairs) {
    const option = APP_ALTERNATIVES.find((a) => a.app === original)?.options.find((o) => o.name === name);
    expect(option?.href).toMatch(/^https:\/\/getartcraft.com\/apps\//);
    expect(option?.note).toMatch(/^(Early alpha|In development)\./);
  }
});

test("every row is well formed", () => {
  const labels = Object.keys(SUPPORT_LABEL);
  for (const a of APP_ALTERNATIVES) {
    expect(a.app.trim()).not.toBe("");
    expect(CATEGORIES).toContain(a.category);
    expect(a.options.length).toBeGreaterThan(0);
    for (const x of a.options) {
      expect(x.name.trim()).not.toBe("");
      expect(labels).toContain(x.support);
      expect(`${x.name} ${x.note ?? ""}`).not.toMatch(/\u2014/); // no em dashes in UI copy
    }
  }
});

test("app names are unique", () => {
  const names = APP_ALTERNATIVES.map((a) => a.app);
  expect(new Set(names).size).toBe(names.length);
});

test("usable alternatives precede Wine workarounds and unavailable originals", () => {
  const priority = (support: string) => support === "none" ? 2 : support === "wine" ? 1 : 0;
  for (const app of APP_ALTERNATIVES) {
    const order = app.options.map((o) => priority(o.support));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  }
  const photoshop = APP_ALTERNATIVES.find((a) => a.app === "Adobe Photoshop")!;
  expect(photoshop.options.map((o) => o.name)).toEqual(["GIMP", "Krita", "Photopea", "PhotoCraft", "Photoshop"]);
});

test("both platforms have a full table", () => {
  expect(appsFor("windows").length).toBeGreaterThanOrEqual(60);
  expect(appsFor("mac").length).toBeGreaterThanOrEqual(60);
  expect(appsFor("windows").some((a) => a.platform === "mac")).toBe(false);
});

test("best support picks the most native option", () => {
  expect(bestSupport({ app: "x", platform: "both", category: "Gaming", options: [{ name: "a", support: "wine" }, { name: "b", support: "web" }] })).toBe("web");
});
