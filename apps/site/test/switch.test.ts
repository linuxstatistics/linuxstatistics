import { expect, test } from "vitest";
import { PROFILES } from "../src/lib/picker-profiles";
import { SWITCH_PICKS, OLDER_PC_PICKS, WHAT_CHANGES, fmt, picksFor, switchFaq } from "../src/lib/switch";

test("every switch pick has a picker profile", () => {
  for (const from of ["windows", "mac"] as const) expect(picksFor(from, PROFILES)).toHaveLength(SWITCH_PICKS[from].length);
  const keys = new Set(PROFILES.map((p) => p.key));
  for (const k of OLDER_PC_PICKS) expect(keys.has(k)).toBe(true);
});

test("copy has no em dashes", () => {
  const text = JSON.stringify([SWITCH_PICKS, WHAT_CHANGES, switchFaq("windows"), switchFaq("mac")]);
  expect(text).not.toMatch(/\u2014/);
});

test("dates read as day month year", () => {
  expect(fmt("2027-10-12")).toBe("12 October 2027");
  expect(switchFaq("windows")[0]!.a).toContain("12 October 2027");
});
