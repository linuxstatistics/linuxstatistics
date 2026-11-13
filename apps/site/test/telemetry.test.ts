import { expect, test } from "vitest";
import { TELEMETRY } from "../src/lib/telemetry";

test("telemetry entries are unique, sourced and plain", () => {
  const keys = TELEMETRY.map((t) => t.key);
  expect(new Set(keys).size).toBe(keys.length);
  for (const t of TELEMETRY) {
    expect(t.source, t.key).toMatch(/^https:\/\//);
    expect(t.detail, t.key).not.toMatch(/\u2014/);
    expect(t.evidence.length, t.key).toBeGreaterThan(10);
  }
});

test("only on-by-default entries say how to turn it off", () => {
  for (const t of TELEMETRY) {
    if (t.level === "counting" || t.level === "usage") expect(t.turnOff, t.key).toBeTruthy();
    else expect(t.turnOff, t.key).toBeUndefined();
    if (t.turnOff) expect(t.turnOff.length, t.key).toBeLessThanOrEqual(100);
  }
});
