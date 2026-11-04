import { afterEach, beforeEach, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { initPgliteDb, addEmailSignup, listEmailSignups, type Database } from "../src/index.js";

let db: Database;
let client: PGlite;

beforeEach(async () => {
  const init = await initPgliteDb();
  db = init.db;
  client = init.client;
});

afterEach(async () => { await client.close(); });

test("stores a signup", async () => {
  await addEmailSignup(db, { email: "a@example.com", source: "footer" });
  const rows = await listEmailSignups(db);
  expect(rows).toHaveLength(1);
  expect(rows[0]!.email).toBe("a@example.com");
  expect(rows[0]!.source).toBe("footer");
});

test("a duplicate email is an idempotent no-op", async () => {
  await addEmailSignup(db, { email: "dup@example.com" });
  await addEmailSignup(db, { email: "dup@example.com", source: "footer" });
  const rows = await listEmailSignups(db);
  expect(rows).toHaveLength(1);
});
