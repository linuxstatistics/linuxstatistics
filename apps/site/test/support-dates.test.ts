import { expect, test } from "vitest";
import type { DistroDetail } from "@linux-statistics/shared";
import { endingSoon, supportRows } from "../src/lib/support-dates";

const cyc = (o: Partial<DistroDetail["releases"][number]>) => ({ cycle: "1", codename: null, releasedOn: null, latest: null, latestOn: null, supportEnds: null, eol: null, lts: false, ...o });
const d = (slug: string, releases: DistroDetail["releases"]) => ({ slug, name: slug, releases });

test("newest released cycle with a date, soonest end first; extended only when later", () => {
  const rows = supportRows([
    d("ubuntu", [cyc({ cycle: "26.10", releasedOn: "2026-12-01", eol: "2027-07-01" }), cyc({ cycle: "26.04", latest: "26.04.1", lts: true, releasedOn: "2026-04-23", supportEnds: "2031-05-29", eol: "2036-04-23" })]),
    d("fedora", [cyc({ cycle: "45", releasedOn: "2026-10-28", eol: "2027-12-01" })]),
    d("nodates", [cyc({ cycle: "1", releasedOn: "2020-01-01" })]),
  ], "2026-11-17");
  expect(rows.map((r) => [r.slug, r.release, r.ends, r.extended])).toEqual([
    ["fedora", "45", "2027-12-01", null],
    ["ubuntu", "26.04.1 LTS", "2031-05-29", "2036-04-23"],
  ]);
});

test("ending soon keeps only still-supported releases inside the window", () => {
  const rows = supportRows([d("a", [cyc({ releasedOn: "2025-01-01", eol: "2027-02-01" })]), d("b", [cyc({ releasedOn: "2024-01-01", eol: "2026-01-01" })]), d("c", [cyc({ releasedOn: "2025-01-01", eol: "2028-01-01" })])], "2026-11-17");
  expect(endingSoon(rows, "2026-11-17").map((r) => r.slug)).toEqual(["a"]);
});
