import { readFileSync } from "node:fs";
import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { getDistroDetail, getDistroReleases, initPgliteDb, upsertDistro, type Database } from "@linux-statistics/db";
import { ENDOFLIFE_PRODUCTS, parseEndoflife, productUrl } from "../src/sources/endoflife.js";
import { ingestEndoflife } from "../src/ingest-endoflife.js";
import { runSources } from "../src/sources-run.js";
import type { FetchLike } from "../src/http.js";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/endoflife-ubuntu.json", import.meta.url), "utf8"));

let db: Database;
let client: PGlite;
beforeEach(async () => {
  ({ db, client } = await initPgliteDb());
});
afterEach(async () => {
  await client.close();
});

test("parseEndoflife maps cycles newest first, with support/eol/lts normalised", () => {
  const rows = parseEndoflife(fixture);
  expect(rows.map((r) => r.cycle)).toEqual(["26.10", "26.04", "25.10", "25.04"]);
  const lts = rows[1]!;
  expect(lts).toMatchObject({ cycle: "26.04", codename: "Resolute Raccoon", lts: true, releasedOn: "2026-04-23", latest: "26.04.1", latestOn: "2026-08-27", supportEnds: "2031-05-29", eol: "2036-04-23" });
  expect(rows[0]!.lts).toBe(false);
  // Products with only `eol` and boolean fields.
  const [r] = parseEndoflife([{ cycle: 13, releaseDate: "2025-08-09", eol: "2028-06-30", lts: false, support: true, latest: "13.1" }]);
  expect(r).toMatchObject({ cycle: "13", supportEnds: "2028-06-30", eol: "2028-06-30", lts: false });
  expect(() => parseEndoflife({ cycles: [] })).toThrow();
  expect(() => parseEndoflife([{ nope: 1 }])).toThrow();
});

test("product mapping uses our slugs and the public URL shape", () => {
  expect(ENDOFLIFE_PRODUCTS.ubuntu).toBe("ubuntu");
  expect(ENDOFLIFE_PRODUCTS.mint).toBe("linuxmint");
  expect(productUrl("linuxmint")).toBe("https://endoflife.date/api/linuxmint.json");
});

/** Fake endoflife.date: fixture for ubuntu, 500 for one product, 404 for the rest. */
const fake: FetchLike = async (url) => {
  if (url.endsWith("/ubuntu.json")) return new Response(JSON.stringify(fixture), { status: 200, headers: { "content-type": "application/json" } });
  if (url.endsWith("/debian.json")) return new Response("boom", { status: 500 });
  return new Response("{}", { status: 404 });
};

test("ingestEndoflife replaces a distro's cycles, keeps last good rows on failure, and shows on the detail", async () => {
  const ubuntu = await upsertDistro(db, { slug: "ubuntu", name: "Ubuntu", family: "debian", status: "active" });
  await upsertDistro(db, { slug: "debian", name: "Debian", family: "debian", status: "active" });
  const r = await ingestEndoflife(db, { fetch: fake, backoffMs: 1 });
  expect(r.written).toBe(1);
  expect(r.cycles).toBe(4);
  expect(r.failed.find((f) => f.slug === "debian")?.error).toMatch(/HTTP 500/);
  expect((await getDistroReleases(db, ubuntu)).map((c) => c.cycle)).toEqual(["26.10", "26.04", "25.10", "25.04"]);

  // Second run with ubuntu now failing keeps the previous rows.
  const r2 = await ingestEndoflife(db, { fetch: async () => new Response("x", { status: 500 }), backoffMs: 1 }).catch((e: Error) => e);
  expect(r2).toBeInstanceOf(Error);
  expect(await getDistroReleases(db, ubuntu)).toHaveLength(4);

  const detail = await getDistroDetail(db, "ubuntu");
  expect(detail?.releases[0]).toMatchObject({ cycle: "26.10", codename: "Stonking Stingray" });
});

test("runs as an isolated source and records the run", async () => {
  await upsertDistro(db, { slug: "ubuntu", name: "Ubuntu", family: "debian", status: "active" });
  const status = await runSources(db, ["endoflife"], { fetch: fake, log: () => {} });
  expect(status.endoflife).toBe("success");
});
