import { expect, test } from "vitest";
import { fits, rankAll, suggest, type Answers } from "../src/lib/picker";
import { PROFILES } from "../src/lib/picker-profiles";
import { decodeAnswers, encodeAnswers, flow, prune, QUESTIONS } from "../src/lib/picker-questions";

const ranks: Record<string, number> = { cachyos: 1, mint: 2, mx: 3, debian: 4, popos: 5, zorin: 6, fedora: 7, endeavour: 8, ubuntu: 9, manjaro: 10, bazzite: 11 };
const rankOf = (k: string) => ranks[k] ?? null;
const base: Answers = { level: "new", use: "everyday" };
const prof = (k: string) => PROFILES.find((p) => p.key === k)!;
const EXPERT_ONLY = PROFILES.filter((p) => p.levels.length === 1 && p.levels[0] === "expert").map((p) => p.key);

test("returns three suggestions with reasons and a match percentage", () => {
  const s = suggest(base, PROFILES, rankOf);
  expect(s).toHaveLength(3);
  for (const x of s) {
    expect(x.reasons.length).toBeGreaterThan(0);
    expect(x.pct).toBeGreaterThan(0);
    expect(x.pct).toBeLessThanOrEqual(100);
  }
});

test("a perfect fit scores 100%", () => {
  const s = suggest({ level: "new", use: "everyday", desktop: "windows-like" }, PROFILES, rankOf);
  expect(s[0]!.pct).toBe(100);
});

test("with no answers at all every fitting distro is listed, by rank", () => {
  const all = rankAll({}, PROFILES, rankOf);
  expect(all).toHaveLength(PROFILES.length);
  expect(all[0]!.key).toBe("cachyos");
});

test("a Windows switcher who wants a familiar desktop gets a Windows-style distro first", () => {
  const s = suggest({ ...base, desktop: "windows-like" }, PROFILES, rankOf);
  expect(prof(s[0]!.key).desktops).toContain("windows-like");
  expect(s[0]!.reasons).toContain("Offers a Windows-style desktop");
});

test("beginners are never offered expert-only systems, in any list", () => {
  for (const use of ["everyday", "gaming", "dev", "creative", "old-hw", "privacy", "server"] as const) {
    for (const x of rankAll({ ...base, use }, PROFILES, rankOf)) expect(EXPERT_ONLY).not.toContain(x.key);
  }
});

test("gaming picks gaming distros", () => {
  const s = suggest({ ...base, level: "some", use: "gaming" }, PROFILES, rankOf);
  for (const x of s) expect(prof(x.key).uses).toContain("gaming");
});

test("an NVIDIA gamer gets distros that set the driver up", () => {
  const s = suggest({ level: "some", use: "gaming", gpu: "nvidia" }, PROFILES, rankOf);
  for (const x of s) expect(prof(x.key).nvidia).toBe("excellent");
  expect(s[0]!.reasons).toContain("NVIDIA drivers set up for you");
});

test("old hardware and low memory favour light systems and drop heavy ones", () => {
  const s = rankAll({ ...base, use: "old-hw", ram: 1 }, PROFILES, rankOf);
  expect(s.length).toBeGreaterThan(3);
  for (const x of s) expect(prof(x.key).minRamGb).toBeLessThanOrEqual(1);
  for (const x of s.slice(0, 3)) {
    const p = prof(x.key);
    expect(p.uses.includes("old-hw") || p.desktops.includes("light")).toBe(true);
  }
});

test("a Raspberry Pi only gets distros with Pi images", () => {
  const s = rankAll({ level: "new", device: "pi" }, PROFILES, rankOf);
  expect(s.length).toBeGreaterThan(0);
  for (const x of s) expect(prof(x.key).platforms).toContain("pi");
  expect(s[0]!.key).toBe("raspios");
});

test("a 32-bit PC only gets distros that still build 32-bit images", () => {
  const s = rankAll({ level: "some", device: "pc32" }, PROFILES, rankOf);
  expect(s.length).toBeGreaterThan(0);
  for (const x of s) expect(prof(x.key).platforms).toContain("pc32");
});

test("a server answer favours server distros", () => {
  const s = suggest({ level: "some", use: "server" }, PROFILES, rankOf);
  for (const x of s) expect(prof(x.key).uses).toContain("server");
});

test("an expert avoiding systemd only sees non-systemd distros on top", () => {
  const s = suggest({ level: "expert", use: "everyday", init: "no-systemd" }, PROFILES, rankOf);
  for (const x of s) expect(prof(x.key).init).toBe("other");
});

test("free-software-only puts FSF-style distros first", () => {
  const s = suggest({ level: "some", use: "everyday", foss: "yes" }, PROFILES, rankOf);
  expect(prof(s[0]!.key).fossOnly).toBe(true);
});

test("no package preference scores the same as skipping the question", () => {
  const base = { level: "expert", use: "dev" } as const;
  expect(suggest({ ...base, pkg: "any" }, PROFILES, rankOf)).toEqual(suggest(base, PROFILES, rankOf));
});

test("not sure about memory rules nothing out", () => {
  const base = { level: "new", use: "everyday" } as const;
  expect(rankAll({ ...base, ram: "any" }, PROFILES, rankOf).length).toBe(rankAll(base, PROFILES, rankOf).length);
});

test("no desktop preference falls back to the familiar one, like skipping", () => {
  const base = { level: "new", use: "everyday", from: "windows" } as const;
  expect(suggest({ ...base, desktop: "any" }, PROFILES, rankOf)).toEqual(suggest(base, PROFILES, rankOf));
});

test("not sure about updates scores like stable", () => {
  const base = { level: "some", use: "everyday" } as const;
  expect(suggest({ ...base, updates: "any" }, PROFILES, rankOf).map((s) => s.key)).toEqual(suggest({ ...base, updates: "stable" }, PROFILES, rankOf).map((s) => s.key));
});

test("wanting undoable updates puts rollback systems first", () => {
  const s = suggest({ level: "some", use: "everyday", undo: "yes" }, PROFILES, rankOf);
  expect(prof(s[0]!.key).undo).toBe("rollback");
});

test("misses explain what doesn't match", () => {
  const all = rankAll({ level: "some", use: "gaming", desktop: "kde" }, PROFILES, rankOf);
  const pop = all.find((x) => x.key === "popos")!;
  expect(pop.misses).toContain("Doesn't offer KDE Plasma by default");
});

test("every profile key is unique and every profile is complete", () => {
  expect(new Set(PROFILES.map((p) => p.key)).size).toBe(PROFILES.length);
  expect(PROFILES.length).toBeGreaterThanOrEqual(60);
  for (const p of PROFILES) {
    expect(p.platforms.length, p.key).toBeGreaterThan(0);
    expect(p.downloadUrl, p.key).toMatch(/^https?:\/\//);
    expect(p.blurb, p.key).not.toMatch(/[—–]/);
  }
});

test("asking for no telemetry puts checked no-telemetry distros first and drops counting ones", () => {
  const s = suggest({ ...base, desktop: "windows-like", telemetry: "none" }, PROFILES, rankOf);
  expect(s[0]!.key).toBe("mint");
  expect(s[0]!.reasons).toContain("Sends no usage data");
  expect(s.map((x) => x.key)).not.toContain("zorin");
});

test("the no-telemetry fact is shown even when counting is fine; only the order changes", () => {
  const fine = rankAll({ ...base, level: "some", use: "gaming", telemetry: "any" }, PROFILES, rankOf);
  expect(fine.find((x) => x.key === "popos")?.reasons).toContain("Sends no usage data");
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
  expect(prof(s[0]!.key).desktops).toContain("windows-like");
});

test("already on Linux changes nothing", () => {
  expect(suggest({ ...base, from: "linux" }, PROFILES, rankOf)).toEqual(suggest(base, PROFILES, rankOf));
});

test("fits() rejects wrong hardware and too little memory", () => {
  expect(fits(prof("bazzite"), { device: "pi" })).toBe(false);
  expect(fits(prof("qubes"), { ram: 4 })).toBe(false);
  expect(fits(prof("arch"), { level: "new" })).toBe(false);
  expect(fits(prof("mint"), { level: "new", device: "pc", ram: 2 })).toBe(true);
});

// Question flow

const ids = (a: Answers) => flow(a).map((q) => q.id);

test("beginners skip updates and the expert questions", () => {
  const f = ids({ level: "new" });
  expect(f).not.toContain("updates");
  expect(f).not.toContain("init");
  expect(f).not.toContain("foss");
  expect(f).not.toContain("pkg");
});

test("experts get init, free-software and package questions", () => {
  expect(ids({ level: "expert" })).toEqual(expect.arrayContaining(["init", "foss", "pkg", "updates"]));
});

test("a Raspberry Pi skips the GPU and undo questions", () => {
  const f = ids({ device: "pi" });
  expect(f).not.toContain("gpu");
  expect(f).not.toContain("undo");
});

test("servers skip desktop, telemetry and GPU", () => {
  const f = ids({ use: "server" });
  expect(f).not.toContain("desktop");
  expect(f).not.toContain("telemetry");
  expect(f).not.toContain("gpu");
});

test("most people answer at most 10 questions", () => {
  expect(ids({ level: "new", use: "everyday", device: "pc", ram: 8 }).length).toBeLessThanOrEqual(10);
});

test("prune drops answers to questions that no longer apply", () => {
  expect(prune({ level: "new", init: "no-systemd", use: "gaming" })).toEqual({ level: "new", use: "gaming" });
});

test("answer codes round-trip and ignore junk", () => {
  const a: Answers = { from: "windows", use: "gaming", level: "some", device: "pc", ram: 8, gpu: "nvidia", updates: "stable", desktop: "kde" };
  const code = encodeAnswers(a);
  expect(code).toMatch(/^[0-9]+$/);
  expect(decodeAnswers(code)).toEqual(a);
  expect(decodeAnswers("")).toEqual({});
  expect(decodeAnswers("abc")).toEqual({});
  expect(decodeAnswers("99999")).toEqual({});
});

test("no question has more than 9 options (one digit each in the code)", () => {
  for (const q of QUESTIONS) expect(q.options.length, q.id).toBeLessThanOrEqual(9);
});

test("AI on an NVIDIA card picks distros with CUDA packages", () => {
  const s = suggest({ level: "some", use: "ai", gpu: "nvidia" }, PROFILES, rankOf);
  for (const x of s) {
    expect(prof(x.key).cuda).toBe(true);
    expect(prof(x.key).uses).toContain("ai");
  }
  expect(s[0]!.reasons).toContain("CUDA available from NVIDIA or the distro's own packages");
});

test("AI on an AMD card picks distros with ROCm", () => {
  const s = suggest({ level: "some", use: "ai", gpu: "amd" }, PROFILES, rankOf);
  for (const x of s) expect(prof(x.key).rocm).toBe(true);
});

test("AI users are always asked about the graphics card, even on a server", () => {
  expect(ids({ use: "ai" })).toContain("gpu");
  expect(ids({ use: "ai", device: "pc", ram: 1 })).toContain("gpu");
});
