import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { getDistroList, getMeta, initPgliteDb, type Database } from "@linux-statistics/db";
import { runSources } from "../src/sources-run.js";
import type { FetchLike } from "../src/http.js";

const here = dirname(fileURLToPath(import.meta.url));
const dw = readFileSync(resolve(here, "fixtures/ranking-full.html"), "utf8");

let db: Database;
let client: PGlite;
beforeAll(async () => {
  ({ db, client } = await initPgliteDb());
});
afterAll(async () => {
  await client.close();
});

test("one source failing never blocks the others, and is recorded as failed", async () => {
  const fake: FetchLike = async (url) => {
    if (url.includes("distrowatch.com")) return new Response(dw, { status: 200 });
    if (url.includes("statcounter.com")) return new Response("<html>maintenance</html>", { status: 200 });
    return new Response("{}", { status: 404 });
  };
  const logs: string[] = [];
  const status = await runSources(db, ["statcounter", "distrowatch", "github"], {
    fetch: fake,
    log: (m) => logs.push(m),
  });
  expect(status).toEqual({ statcounter: "failed", distrowatch: "success", github: "failed" });
  expect((await getDistroList(db))[0]!.slug).toBe("cachyos");
  const meta = await getMeta(db);
  expect(meta.sources.find((s) => s.source === "distrowatch")!.status).toBe("success");
  expect(meta.sources.find((s) => s.source === "statcounter")!.status).toBe("never");
  expect(logs.some((l) => l.startsWith("statcounter: FAILED"))).toBe(true);
});

test("a broken DistroWatch page keeps the previous rankings", async () => {
  const before = await getDistroList(db);
  const broken: FetchLike = async () => new Response("<html><body>new layout</body></html>", { status: 200 });
  const status = await runSources(db, ["distrowatch"], { fetch: broken, log: () => {} });
  expect(status.distrowatch).toBe("failed");
  expect(await getDistroList(db)).toEqual(before);
});
