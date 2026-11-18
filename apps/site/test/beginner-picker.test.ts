import { expect, test } from "vitest";
import { decodeAnswers } from "../src/lib/picker-questions";
import { BEGINNER_QUESTIONS, advancedResultsHref, beginnerHint, beginnerOptions, beginnerFlow, beginnerQuery, beginnerRecommendation, parseBeginner, pickerMode, pruneBeginner } from "../src/lib/beginner-picker";

test("uncertain choices are always last and blocked hardware skips irrelevant follow-ups", () => {
  for (const q of BEGINNER_QUESTIONS) expect(["other", "unsure"]).toContain(beginnerOptions(q).at(-1)?.[0]);
  expect(beginnerFlow({ origin: "mac", machine: "apple", purpose: "ai" })).toHaveLength(3);
});

const known = new Set(["mint", "ubuntu", "bazzite", "zorin"]);
const everyday = { origin: "windows", machine: "pc", purpose: "everyday" };
test("legacy share URLs always retain the detailed quiz", () => {
  expect(pickerMode(new URLSearchParams("a=123&v=1"))).toBe("advanced");
  expect(pickerMode(new URLSearchParams("mode=advanced"))).toBe("advanced");
  expect(pickerMode(new URLSearchParams())).toBe("beginner");
});
test("short URL contract rejects malformed values and prunes irrelevant answers", () => {
  expect(parseBeginner(new URLSearchParams("v=1&machine=evil&origin=windows&ram=8"))).toEqual({ origin: "windows" });
  expect(parseBeginner(new URLSearchParams(beginnerQuery(everyday)))).toEqual(everyday);
  expect(pruneBeginner({ ...everyday, gpu: "nvidia", ram: "2" })).toEqual(everyday);
});
test("three core questions with only relevant follow-ups", () => {
  expect(beginnerFlow(everyday)).toHaveLength(3);
  expect(beginnerFlow({ ...everyday, purpose: "gaming" }).at(-1)?.id).toBe("gpu");
  expect(beginnerFlow({ ...everyday, purpose: "ai" }).at(-1)?.id).toBe("gpu");
  expect(beginnerFlow({ ...everyday, purpose: "older" }).at(-1)?.id).toBe("ram");
});

test("AI preserves the GPU answer and explains acceleration limits", () => {
  const a = { ...everyday, purpose: "ai", gpu: "amd" };
  expect(parseBeginner(new URLSearchParams(beginnerQuery(a)))).toEqual(a);
  const result = beginnerRecommendation(a, known);
  expect(result.kind).toBe("recommendation");
  if (result.kind === "recommendation") {
    expect(result.slug).toBe("ubuntu");
    expect(result.caveat).toContain("not every AMD card");
  }
});
test("default is editorial, with one lead and at most two alternatives", () => {
  const r = beginnerRecommendation(everyday, known);
  expect(r.kind).toBe("recommendation");
  if (r.kind === "recommendation") { expect(r.slug).toBe("mint"); expect(r.alternatives.length).toBeLessThanOrEqual(2); }
});
test.each(["apple", "arm", "pc32", "unsure"])("hardware %s does not get a generic desktop image", (machine) => {
  expect(beginnerRecommendation({ ...everyday, machine }, known).kind).toBe("compatibility-check");
});
test("Chromebooks, unknown memory and missing catalogue candidates get guidance", () => {
  expect(beginnerRecommendation({ ...everyday, origin: "chromeos" }, known).kind).toBe("compatibility-check");
  expect(beginnerRecommendation({ ...everyday, purpose: "older", ram: "unsure" }, known).kind).toBe("compatibility-check");
  expect(beginnerRecommendation({ ...everyday, purpose: "older", ram: "1" }, known).kind).toBe("compatibility-check");
  expect(beginnerRecommendation(everyday, new Set()).kind).toBe("compatibility-check");
});

test("the machine tip matches the computer the person uses now", () => {
  const machine = BEGINNER_QUESTIONS.find((q) => q.id === "machine")!;
  expect(beginnerHint(machine, { origin: "mac" })).toContain("About This Mac");
  expect(beginnerHint(machine, { origin: "windows" })).toContain("Settings → System → About");
  expect(beginnerHint(machine, { origin: "linux" })).toContain("`uname -m`");
  expect(beginnerHint(machine, { origin: "unsure" })).toMatch(/Settings → System → About.*About This Mac/);
  expect(beginnerHint(machine, { origin: "chromeos" })).toBeUndefined();
  expect(beginnerHint(machine, {})).toBeUndefined();
});

test("older NVIDIA is a valid short-quiz answer and keeps the gaming route", () => {
  const a = { ...everyday, purpose: "gaming", gpu: "nvidia-old" };
  expect(parseBeginner(new URLSearchParams(beginnerQuery(a)))).toEqual(a);
  const r = beginnerRecommendation(a, known);
  expect(r.kind === "recommendation" && r.slug).toBe("bazzite");
  expect(r.caveat).toContain("older NVIDIA");
});

test("machine options: PCs, then Macs newest first, then boards, then not sure", () => {
  const machine = BEGINNER_QUESTIONS.find((q) => q.id === "machine")!;
  expect(beginnerOptions(machine).map(([v]) => v)).toEqual(["pc", "pc32", "apple", "intel-mac", "arm", "unsure"]);
  const gpu = BEGINNER_QUESTIONS.find((q) => q.id === "gpu")!;
  expect(beginnerOptions(gpu).map(([v]) => v)).toEqual(["nvidia", "nvidia-old", "amd", "intel", "unsure"]);
});

test("GPU names read normally and Intel Mac advice isn't repeated in the caveat", () => {
  const intel = beginnerRecommendation({ ...everyday, purpose: "gaming", gpu: "intel" }, known);
  expect(intel.caveat).toContain("image picker for Intel and");
  expect(intel.caveat).not.toContain("INTEL");
  const mac = beginnerRecommendation({ ...everyday, machine: "intel-mac" }, known);
  expect(mac.kind).toBe("recommendation");
  expect(mac.caveat).not.toMatch(/Intel Mac/);
});

test("dead ends explain the actual answer and point to matches where we have them", () => {
  const unsure = beginnerRecommendation({ ...everyday, machine: "unsure" }, known);
  expect(unsure.kind === "compatibility-check" && unsure.title).toBe("Find out which computer you have");
  expect(unsure.kind === "compatibility-check" && unsure.advanced).toBeNull();
  const old32 = beginnerRecommendation({ ...everyday, machine: "pc32" }, known);
  expect(old32.kind === "compatibility-check" && old32.advanced).toMatch(/^\/pick\/\?a=\d+$/);
  const arm = beginnerRecommendation({ ...everyday, machine: "arm" }, known);
  expect(arm.kind === "compatibility-check" && arm.title).toBe("Use your board's own system");
  const chromebook = beginnerRecommendation({ ...everyday, origin: "chromeos" }, known);
  expect(chromebook.kind === "compatibility-check" && chromebook.title).toBe("Check your Chromebook first");
  expect(chromebook.kind === "compatibility-check" && chromebook.advanced).toBeTruthy();
  const tiny = beginnerRecommendation({ ...everyday, purpose: "older", ram: "1" }, known);
  expect(tiny.kind === "compatibility-check" && tiny.advanced).toBeTruthy();
});

test("advanced links carry the short-quiz answers as a beginner on that computer", () => {
  const href = advancedResultsHref({ origin: "windows", machine: "pc32", purpose: "older", ram: "1" })!;
  const a = decodeAnswers(new URLSearchParams(href.split("?")[1]).get("a"));
  expect(a).toMatchObject({ from: "windows", use: "old-hw", level: "new", device: "pc32", ram: 1 });
  expect(advancedResultsHref({ origin: "windows", machine: "unsure", purpose: "everyday" })).toBeNull();
  // Someone already on Linux isn't assumed to be a beginner.
  expect(decodeAnswers(new URLSearchParams(advancedResultsHref({ origin: "linux", machine: "pc32", purpose: "everyday" })!.split("?")[1]).get("a")).level).toBeUndefined();
});

test("creative work keeps Mint but links to creative distros for a beginner on that computer", () => {
  const r = beginnerRecommendation({ ...everyday, purpose: "work" }, known);
  expect(r.kind === "recommendation" && r.slug).toBe("mint");
  const href = r.kind === "recommendation" ? r.creative! : "";
  expect(decodeAnswers(new URLSearchParams(href.split("?")[1]).get("a"))).toMatchObject({ use: "creative", level: "new", device: "pc" });
  const plain = beginnerRecommendation(everyday, known);
  expect(plain.kind === "recommendation" && plain.creative).toBeFalsy();
});
