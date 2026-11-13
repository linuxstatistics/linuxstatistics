import { expect, test } from "vitest";
import type { DistroDetail } from "@linux-statistics/shared";
import { detailRows, releaseStats } from "../src/components/DistroStats";

const base = { releases: [] } as unknown as DistroDetail;
const cyc = (o: Partial<DistroDetail["releases"][number]>) => ({ cycle: "1", codename: null, releasedOn: null, latest: null, latestOn: null, supportEnds: null, eol: null, lts: false, ...o });

test("no lifecycle data, no rows", () => {
  expect(releaseStats(base)).toEqual([]);
});

test("newest released cycle wins; LTS and extended support are shown; future cycles are skipped", () => {
  const data = {
    releases: [
      cyc({ cycle: "27.04", releasedOn: "2027-04-23" }),
      cyc({ cycle: "26.04", codename: "Resolute Raccoon", lts: true, releasedOn: "2026-04-23", latest: "26.04.1", latestOn: "2026-08-27", supportEnds: "2031-05-29", eol: "2036-04-23" }),
    ],
  } as unknown as DistroDetail;
  const rows = releaseStats(data, "2026-11-08");
  expect(rows[0]).toEqual(["Latest release", "26.04.1 LTS", "Resolute Raccoon, released Aug 2026"]);
  expect(rows[1]).toEqual(["Supported until", "May 2031", "extended support to Apr 2036"]);
});

test("past end date reads as ended", () => {
  const data = { releases: [cyc({ cycle: "11", releasedOn: "2021-08-14", eol: "2024-08-14" })] } as unknown as DistroDetail;
  expect(releaseStats(data, "2026-11-08")[1]).toEqual(["Support ended", "Aug 2024", undefined]);
});

const detail = (o: Partial<DistroDetail>) => ({ family: "debian", basedOnSlug: null, firstReleaseYear: null, releases: [], repoFullName: null, stars: null, commitsLast30d: null, userRating: { count: 0, average: null, mean: null, verifiedCount: 0 }, usesItCount: 0, status: "active", ...o }) as unknown as DistroDetail;

test("details list only known facts; 'Other' family is left out, independent is explained", () => {
  expect(detailRows(detail({ family: "other" }))).toEqual([]);
  expect(detailRows(detail({ family: "independent" }))[0]).toMatchObject({ label: "Family", value: "Independent (not based on another distro)" });
  const mint = detailRows(detail({ basedOnSlug: "ubuntu", firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", stars: 5648, commitsLast30d: 108 }), "Ubuntu");
  expect(mint.map((r) => r.label)).toEqual(["Family", "Based on", "First released", "GitHub"]);
  expect(mint.find((r) => r.label === "Based on")).toMatchObject({ value: "Ubuntu", href: "/distro/ubuntu/" });
  expect(mint.find((r) => r.label === "GitHub")?.value).toBe("5,648 stars · 108 commits in 30 days");
});

test("discontinued distros say so first", () => {
  expect(detailRows(detail({ status: "discontinued" }))[0]).toEqual({ label: "Status", value: "Discontinued" });
});
