import { expect, test } from "vitest";
import type { Meta } from "@linux-statistics/shared";
import { indexDate } from "../src/lib/data";

const meta = (sources: Meta["sources"]): Meta => ({ trackedDistros: 0, sources });

test("index date follows the daily rebuild, not only the monthly source", () => {
  expect(indexDate(meta([
    { source: "distrowatch", lastSuccessAt: "2026-11-18T10:17:51.731Z", status: "success" },
    { source: "wikipedia", lastSuccessAt: "2026-11-12T17:08:53.709Z", status: "success" },
  ]))).toBe("2026-11-18");
});

test("index date uses whichever rebuild input is newer", () => {
  expect(indexDate(meta([
    { source: "distrowatch", lastSuccessAt: "2026-11-01T02:00:00.000Z", status: "success" },
    { source: "wikipedia", lastSuccessAt: "2026-11-02T03:00:00.000Z", status: "success" },
  ]))).toBe("2026-11-02");
});

test("index date is null when neither input has run", () => {
  expect(indexDate(meta([{ source: "github", lastSuccessAt: "2026-11-18T00:00:00.000Z", status: "success" }]))).toBeNull();
});
