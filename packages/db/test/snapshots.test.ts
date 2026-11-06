import { afterAll, beforeAll, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import {
  distros,
  popularitySnapshots,
  ingestionRuns,
  marketShare,
} from "../src/schema.js";

let db: Database;
let client: PGlite;
let distroId: number;

beforeAll(async () => {
  ({ db, client } = await setupTestDb());
  const [row] = await db
    .insert(distros)
    .values({ slug: "fedora", name: "Fedora", family: "rpm" })
    .returning();
  distroId = row!.id;
});

afterAll(async () => {
  await client.close();
});

test("a popularity snapshot links to its distro and records its source", async () => {
  await db.insert(popularitySnapshots).values({
    source: "distrowatch",
    distroId,
    capturedAt: new Date(),
    rank: 3,
    hitsPerDay: 1800,
    period: "last-12-months",
  });
  const rows = await db
    .select()
    .from(popularitySnapshots)
    .where(eq(popularitySnapshots.distroId, distroId));
  expect(rows[0]?.rank).toBe(3);
  expect(rows[0]?.source).toBe("distrowatch");
});

test("market share stores decimal percentages", async () => {
  await db.insert(marketShare).values({
    capturedAt: new Date(),
    region: "global",
    platform: "linux",
    sharePct: "4.130",
  });
  const rows = await db.select().from(marketShare);
  expect(Number(rows[0]?.sharePct)).toBeCloseTo(4.13, 2);
});

test("an ingestion run defaults to running with zero rows", async () => {
  const [run] = await db.insert(ingestionRuns).values({ source: "github" }).returning();
  expect(run?.status).toBe("running");
  expect(run?.rowsWritten).toBe(0);
});
