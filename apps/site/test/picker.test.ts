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

test("asking for no telemetry puts checked no-telemetry distros first and drops counting ones", () => {
  const s = suggest({ ...base, desktop: "windows-like", telemetry: "none" }, PROFILES, rankOf);
  expect(s[0]!.key).toBe("mint");
  expect(s[0]!.reasons).toContain("Sends no usage data");
  expect(s.map((x) => x.key)).not.toContain("zorin");
});

test("the no-telemetry fact is shown even when counting is fine; only the order changes", () => {
  const fine = suggest({ ...base, level: "some", use: "gaming", telemetry: "any" }, PROFILES, rankOf);
  const pop = fine.find((x) => x.key === "popos");
  expect(pop?.reasons).toContain("Sends no usage data");
  const strict = suggest({ ...base, level: "some", use: "gaming", telemetry: "none" }, PROFILES, rankOf);
  expect(strict.find((x) => x.key === "popos")?.reasons).toContain("Sends no usage data");
  expect(strict.map((x) => x.key)).not.toContain("bazzite");
});

test("coming from a Mac nudges toward a Mac-style desktop only without a desktop preference", () => {
  const mac = suggest({ ...base, from: "mac" }, PROFILES, rankOf);
  expect(mac.some((r) => r.reasons.includes("Feels familiar coming from a Mac"))).toBe(true);
  const pinned = suggest({ ...base, from: "mac", desktop: "kde" }, PROFILES, rankOf);
  expect(pinned.every((r) => !r.reasons.includes("Feels familiar coming from a Mac"))).toBe(true);
});

test("coming from Windows puts a Windows-style distro first", () => {
  const s = suggest({ ...base, from: "windows" }, PROFILES, rankOf);
  const p = PROFILES.find((x) => x.key === s[0]!.key)!;
  expect(p.desktops).toContain("windows-like");
});

test("already on Linux changes nothing", () => {
  expect(suggest({ ...base, from: "linux" }, PROFILES, rankOf)).toEqual(suggest(base, PROFILES, rankOf));
});
