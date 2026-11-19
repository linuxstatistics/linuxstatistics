import { expect, test } from "vitest";
import { filterSignups, type Signup } from "../src/components/AdminEmail";

const rows: Signup[] = [
  { id: 1, email: "Old@Example.com", source: "/", createdAt: "2026-11-10T09:00:00.000Z" },
  { id: 2, email: "new@example.org", source: "/distro/mint/", createdAt: "2026-11-18T09:00:00.000Z" },
  { id: 3, email: "nosource@example.net", source: null, createdAt: "2026-11-15T09:00:00.000Z" },
];

test("newest first, all rows without a query", () => {
  expect(filterSignups(rows, "").map((r) => r.id)).toEqual([2, 3, 1]);
});

test("search matches email or page, case-insensitively", () => {
  expect(filterSignups(rows, "old@").map((r) => r.id)).toEqual([1]);
  expect(filterSignups(rows, "MINT").map((r) => r.id)).toEqual([2]);
  expect(filterSignups(rows, "  example.n ").map((r) => r.id)).toEqual([3]);
  expect(filterSignups(rows, "nobody")).toEqual([]);
});
