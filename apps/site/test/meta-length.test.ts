import { expect, test } from "vitest";
import { DESC_MAX, TITLE_MAX, fitDescription, fitTitle } from "../src/lib/meta-length";

test("titles keep the brand when they fit and drop only the brand when it doesn't", () => {
  expect(fitTitle("Privacy policy | LinuxStatistics")).toBe("Privacy policy | LinuxStatistics");
  const long = "Linux distro support dates and end of life by release | LinuxStatistics";
  expect(long.length).toBeGreaterThan(TITLE_MAX);
  expect(fitTitle(long)).toBe("Linux distro support dates and end of life by release");
  // Never cuts page words: too long even without the brand stays whole for the build check.
  const tooLong = "A".repeat(80) + " | LinuxStatistics";
  expect(fitTitle(tooLong)).toBe("A".repeat(80));
  // Home and other titles without the suffix are left alone.
  expect(fitTitle("Arch is #1. Linux distro rankings | LinuxStatistics")).toBe("Arch is #1. Linux distro rankings | LinuxStatistics");
});

test("descriptions over the limit end at a sentence, else a word, with a period", () => {
  const two = `${"Short first sentence about support dates for many Linux distributions here."} ${"Second sentence that pushes the total well past the limit for search results and more."}`;
  expect(two.length).toBeGreaterThan(DESC_MAX);
  expect(fitDescription(two)).toBe("Short first sentence about support dates for many Linux distributions here.");
  const one = `${"word ".repeat(40).trim()}`;
  const cut = fitDescription(one);
  expect(cut.length).toBeLessThanOrEqual(DESC_MAX);
  expect(cut.endsWith("word.")).toBe(true);
  expect(fitDescription("Already fine.")).toBe("Already fine.");
});
