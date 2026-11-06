import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { expect, test } from "vitest";
import { parseDistrowatchRanking } from "../src/sources/distrowatch.js";

const here = dirname(fileURLToPath(import.meta.url));
const small = readFileSync(resolve(here, "fixtures/distrowatch.html"), "utf8");
// Synthetic full-size page in the real layout (invented ranks and hits).
const full = readFileSync(resolve(here, "fixtures/ranking-full.html"), "utf8");

test("reads each table's period from its heading and the DistroWatch key from the link", () => {
  const rows = parseDistrowatchRanking(small);
  expect(rows).toHaveLength(10);
  expect(rows[0]).toEqual({
    rank: 1,
    key: "mx",
    name: "MX Linux",
    hitsPerDay: 2512,
    period: "last-12-months",
  });
  expect(rows.filter((r) => r.period === "last-1-month").map((r) => r.key)).toEqual([
    "fedora",
    "mint",
    "mx",
    "debian",
    "endeavour",
  ]);
});

test("strips thousands separators from hits", () => {
  const rows = parseDistrowatchRanking(small);
  expect(rows[1]!.hitsPerDay).toBe(2103);
});

test("parses a full-size page: 4 periods x 450 rows", () => {
  const rows = parseDistrowatchRanking(full);
  const byPeriod = new Map<string, number>();
  for (const r of rows) byPeriod.set(r.period, (byPeriod.get(r.period) ?? 0) + 1);
  expect(Object.fromEntries(byPeriod)).toEqual({
    "last-12-months": 450,
    "last-6-months": 450,
    "last-3-months": 450,
    "last-1-month": 450,
  });
  const top = rows.find((r) => r.period === "last-12-months" && r.rank === 1);
  expect(top).toEqual({ rank: 1, key: "cachyos", name: "CachyOS", hitsPerDay: 4000, period: "last-12-months" });
  expect(rows.find((r) => r.period === "last-12-months" && r.rank === 2)?.key).toBe("mint");
});

test("fails loudly when the layout changes (too few rows)", () => {
  const broken = "<html><body><table><tr><td>nothing useful here</td></tr></table></body></html>";
  expect(() => parseDistrowatchRanking(broken)).toThrow(/layout may have changed/);
});

test("fails on an unrecognised table heading", () => {
  const html = small.replace("Last 1 month", "Last fortnight");
  expect(() => parseDistrowatchRanking(html)).toThrow(/heading/);
});

test("fails on duplicate ranks within a period", () => {
  const html = small.replace('<th class="phr1">2</th><td class="phr2"><a title="Based on: Ubuntu"', '<th class="phr1">1</th><td class="phr2"><a title="Based on: Ubuntu"');
  expect(() => parseDistrowatchRanking(html)).toThrow(/duplicate rank/);
});

test("fails when a row has no DistroWatch key", () => {
  const html = small.replace('href="debian">Debian</a></td><td class="phr3">1,602', 'href="">Debian</a></td><td class="phr3">1,602');
  expect(() => parseDistrowatchRanking(html)).toThrow(/key/);
});
