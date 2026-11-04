import { expect, test } from "vitest";
import { suggest, type Answers } from "../src/lib/picker";
import { PROFILES } from "../src/lib/picker-profiles";

const ranks: Record<string, number> = { cachyos: 1, mint: 2, mx: 3, debian: 4, popos: 5, zorin: 6, fedora: 7, endeavour: 8, ubuntu: 9, manjaro: 10, bazzite: 11 };
const rankOf = (k: string) => ranks[k] ?? null;
const base: Answers = { level: "new", use: "everyday", hardware: "new", updates: "any", desktop: "any" };

test("returns three suggestions with reasons", () => {
  const s = suggest(base, PROFILES, rankOf);
  expect(s).toHaveLength(3);
  for (const x of s) expect(x.reasons.length).toBeGreaterThan(0);
});

test("a Windows switcher who wants a familiar desktop gets Mint or Zorin first", () => {
  const s = suggest({ ...base, desktop: "windows-like" }, PROFILES, rankOf);
  expect(["mint", "zorin"]).toContain(s[0]!.key);
  expect(s[0]!.reasons).toContain("Offers a Windows-style desktop");
});

test("beginners are never offered expert-only systems", () => {
  for (const use of ["everyday", "gaming", "dev", "old-hw", "privacy"] as const) {
    const s = suggest({ ...base, use }, PROFILES, rankOf);
    for (const x of s) expect(["arch", "nixos", "void", "qubes", "kali", "alpine"]).not.toContain(x.key);
  }
});

test("gaming picks gaming distros", () => {
  const s = suggest({ ...base, level: "some", use: "gaming" }, PROFILES, rankOf);
  for (const x of s) expect(PROFILES.find((p) => p.key === x.key)!.uses).toContain("gaming");
});

test("old hardware favours light systems", () => {
  const s = suggest({ ...base, use: "old-hw", hardware: "old" }, PROFILES, rankOf);
  for (const x of s) {
    const p = PROFILES.find((q) => q.key === x.key)!;
    expect(p.uses.includes("old-hw") || p.desktops.includes("light")).toBe(true);
  }
});

test("every profile key is unique", () => {
  expect(new Set(PROFILES.map((p) => p.key)).size).toBe(PROFILES.length);
});
