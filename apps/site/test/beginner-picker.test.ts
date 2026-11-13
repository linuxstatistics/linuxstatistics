import { expect, test } from "vitest";
import { BEGINNER_QUESTIONS, beginnerOptions, beginnerFlow, beginnerQuery, beginnerRecommendation, parseBeginner, pickerMode, pruneBeginner } from "../src/lib/beginner-picker";

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
