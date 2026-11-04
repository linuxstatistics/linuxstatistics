import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  addAlias,
  getDistroList,
  getMarketShare,
  initPgliteDb,
  upsertDistro,
  type Database,
} from "@linux-statistics/db";
import { ingestStatcounter } from "../src/ingest-statcounter.js";
import { ingestGithub } from "../src/ingest-github.js";
import type { FetchLike } from "../src/http.js";

const here = dirname(fileURLToPath(import.meta.url));
const scCsv = readFileSync(resolve(here, "fixtures/statcounter-desktop-ww-2026-11-03.csv"), "utf8");

let db: Database;
let client: PGlite;
beforeEach(async () => {
  ({ db, client } = await initPgliteDb());
});
afterEach(async () => {
  await client.close();
});

const csvFetch: FetchLike = async () => new Response(scCsv, { status: 200 });

test("StatCounter ingest upserts monthly global shares and is idempotent", async () => {
  const n = await ingestStatcounter(db, { fetch: csvFetch, now: new Date("2026-11-03T00:00:00Z") });
  expect(n).toBeGreaterThan(0);
  await ingestStatcounter(db, { fetch: csvFetch, now: new Date("2026-11-03T00:00:00Z") });
  const linux = (await getMarketShare(db, { region: "global" })).filter((p) => p.platform === "linux");
  expect(linux).toHaveLength(14); // 14 months in the fixture, no duplicates
  expect(linux.find((p) => p.capturedAt.startsWith("2026-09"))?.sharePct).toBeCloseTo(4.54, 2);
});

test("StatCounter ingest writes nothing when the CSV is empty for the region", async () => {
  const empty: FetchLike = async () => new Response('"Date",""\n2026-10', { status: 200 });
  await expect(ingestStatcounter(db, { fetch: empty })).rejects.toThrow(/platform columns/);
  expect(await getMarketShare(db, { region: "global" })).toHaveLength(0);
});

test("StatCounter ingest stops at once on 429", async () => {
  let calls = 0;
  const limited: FetchLike = async () => {
    calls += 1;
    return new Response("slow down", { status: 429 });
  };
  await expect(ingestStatcounter(db, { fetch: limited })).rejects.toThrow(/429/);
  expect(calls).toBe(1);
});

function githubFake(failRepo?: string): FetchLike {
  return async (url) => {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean); // repos, owner, name, [kind]
    const full = `${parts[1]}/${parts[2]}`;
    if (full === failRepo) return new Response("{}", { status: 404 });
    if (parts.length === 3) {
      return Response.json({ full_name: full, stargazers_count: 100, forks_count: 10, open_issues_count: 5 });
    }
    const last = parts[3] === "commits" ? 42 : 7;
    return new Response("[{}]", {
      status: 200,
      headers: { link: `<https://api.github.com/x?per_page=1&page=2>; rel="next", <https://api.github.com/x?per_page=1&page=${last}>; rel="last"` },
    });
  };
}

async function addDistro(key: string) {
  const id = await upsertDistro(db, { slug: key, name: key, family: "other", status: "active" });
  await addAlias(db, "distrowatch", key, id);
}

test("GitHub ingest records stars, 30-day commits and contributors; one bad repo doesn't stop the rest", async () => {
  await addDistro("mint");
  await addDistro("arch");
  const res = await ingestGithub(db, { fetch: githubFake("archlinux/archinstall"), now: new Date("2026-11-03T00:00:00Z") });
  expect(res.written).toBe(1);
  expect(res.failed).toEqual([{ repo: "archlinux/archinstall", error: "HTTP 404" }]);
  const mint = (await getDistroList(db)).find((d) => d.slug === "mint")!;
  expect(mint).toMatchObject({ stars: 100, commitsLast30d: 42, repoFullName: "linuxmint/cinnamon" });
});

test("GitHub ingest stops the run on a rate limit", async () => {
  await addDistro("mint");
  const limited: FetchLike = async () => new Response("rate limited", { status: 403 });
  await expect(ingestGithub(db, { fetch: limited })).rejects.toThrow(/403/);
});
