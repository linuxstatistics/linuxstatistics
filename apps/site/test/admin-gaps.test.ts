import { expect, test } from "vitest";
import { LABEL, gapRows, type GapReport } from "../src/components/AdminGaps";
import { GAP_FIELDS, GAP_LABEL } from "../../worker/src/gaps";

const r: GapReport = {
  generatedAt: "2026-11-16T03:00:00.000Z",
  considered: 3,
  rows: [
    { slug: "b", name: "B", rank: 9, missing: ["telemetry"] },
    { slug: "a", name: "A", rank: 2, missing: ["telemetry", "repo"] },
    { slug: "c", name: "C", rank: 5, missing: ["repo"] },
  ],
  newUnprofiled: [],
  proposals: [],
};

test("rows sort by rank and filter by missing field", () => {
  expect(gapRows(r, "").map((x) => x.slug)).toEqual(["a", "c", "b"]);
  expect(gapRows(r, "repo").map((x) => x.slug)).toEqual(["a", "c"]);
  expect(gapRows(r, "homepage")).toEqual([]);
});

test("the page's labels match the worker report's fields", () => {
  expect(LABEL).toEqual(GAP_LABEL);
  expect(Object.keys(LABEL)).toEqual([...GAP_FIELDS]);
});
