import { describe, expect, it } from "vitest";
import type { Meta } from "@linux-statistics/shared";
import { daysAgoText, staleSources } from "../src/lib/freshness";

const now = new Date("2026-11-08T12:00:00Z");
const meta = (sources: Meta["sources"]): Meta => ({ trackedDistros: 1, sources });

describe("staleSources", () => {
  it("flags a daily source older than two days", () => {
    const m = meta([{ source: "distrowatch", lastSuccessAt: "2026-11-05T02:15:00Z", status: "success" }]);
    expect(staleSources(m, now).map((s) => s.source)).toEqual(["distrowatch"]);
  });

  it("keeps a weekly source quiet inside two weeks", () => {
    const m = meta([{ source: "github", lastSuccessAt: "2026-10-28T03:30:00Z", status: "success" }]);
    expect(staleSources(m, now)).toEqual([]);
  });

  it("ignores sources that never ran", () => {
    const m = meta([{ source: "statcounter", lastSuccessAt: null, status: "never" }]);
    expect(staleSources(m, now)).toEqual([]);
  });

  it("labels and words the age", () => {
    const m = meta([{ source: "statcounter", lastSuccessAt: "2026-08-03T04:00:00Z", status: "success" }]);
    const s = staleSources(m, now)[0]!;
    expect(s.label).toBe("Desktop share");
    expect(s.ago).toBe("3 months ago");
  });
});

describe("daysAgoText", () => {
  it("steps through units", () => {
    expect(daysAgoText(0.4)).toBe("today");
    expect(daysAgoText(1.5)).toBe("yesterday");
    expect(daysAgoText(5)).toBe("5 days ago");
    expect(daysAgoText(20)).toBe("2 weeks ago");
    expect(daysAgoText(95)).toBe("3 months ago");
  });
});
