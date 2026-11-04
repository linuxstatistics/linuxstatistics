import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { expect, test } from "vitest";
import { parseDistrowatchRanking } from "../src/sources/distrowatch.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(resolve(here, "fixtures/distrowatch.html"), "utf8");

test("parses the ranking table into ordered rows", () => {
  const rows = parseDistrowatchRanking(fixture);
  expect(rows).toHaveLength(10);
  expect(rows[0]).toEqual({
    rank: 1,
    name: "MX Linux",
    hitsPerDay: 2512,
    period: "last-12-months",
  });
  expect(rows[1]!.name).toBe("Linux Mint");
  expect(rows[9]!.rank).toBe(10);
});

test("strips thousands separators from hits", () => {
  const rows = parseDistrowatchRanking(fixture);
  expect(rows[1]!.hitsPerDay).toBe(2103);
});

test("fails loudly when the layout changes (too few rows)", () => {
  const broken = "<html><body><table><tr><td>nothing useful here</td></tr></table></body></html>";
  expect(() => parseDistrowatchRanking(broken)).toThrow(/layout may have changed/);
});
