import { afterAll, beforeAll, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import { distros } from "../src/schema.js";
import { initPgliteDb, upsertDistro, schema } from "../src/index.js";

let db: Database;
let client: PGlite;

beforeAll(async () => {
  ({ db, client } = await setupTestDb());
});

afterAll(async () => {
  await client.close();
});

test("insert and read a distro", async () => {
  await db.insert(distros).values({
    slug: "ubuntu",
    name: "Ubuntu",
    family: "debian",
    homepage: "https://ubuntu.com",
    firstReleaseYear: 2004,
  });
  const rows = await db.select().from(distros).where(eq(distros.slug, "ubuntu"));
  expect(rows).toHaveLength(1);
  expect(rows[0]?.name).toBe("Ubuntu");
  expect(rows[0]?.status).toBe("active");
});

test("slug is unique", async () => {
  await expect(
    db.insert(distros).values({ slug: "ubuntu", name: "Dup", family: "debian" }),
  ).rejects.toThrow();
});

test("enforces one contribution per user per distro", async () => {
  const { db, client } = await initPgliteDb();
  const distroId = await upsertDistro(db, { slug: "x", name: "X", family: "arch", status: "active" });
  const [user] = await db.insert(schema.users)
    .values({ provider: "github", providerUserId: "1", username: "a", role: "user" }).returning();
  await db.insert(schema.distroContributions)
    .values({ userId: user!.id, distroId, rating: 5, usesIt: true });
  await expect(
    db.insert(schema.distroContributions)
      .values({ userId: user!.id, distroId, rating: 3, usesIt: false }),
  ).rejects.toThrow();
  await client.close();
});
