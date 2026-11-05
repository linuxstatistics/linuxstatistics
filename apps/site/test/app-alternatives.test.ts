import { expect, test } from "vitest";
import { APP_ALTERNATIVES, CATEGORIES, SUPPORT_LABEL, appsFor, bestSupport } from "../src/lib/app-alternatives";

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

test("both platforms have a full table", () => {
  expect(appsFor("windows").length).toBeGreaterThanOrEqual(60);
  expect(appsFor("mac").length).toBeGreaterThanOrEqual(60);
  expect(appsFor("windows").some((a) => a.platform === "mac")).toBe(false);
});

test("best support picks the most native option", () => {
  expect(bestSupport({ app: "x", platform: "both", category: "Gaming", options: [{ name: "a", support: "wine" }, { name: "b", support: "web" }] })).toBe("web");
});
