import { afterAll, beforeAll, expect, test } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { setupTestDb } from "./helpers.js";
import type { Database } from "../src/client.js";
import { addSuggestion, listSuggestions, setSuggestionStatus } from "../src/suggestions.js";

let db: Database;
let client: PGlite;
beforeAll(async () => ({ db, client } = await setupTestDb()));
afterAll(async () => client.close());

test("stores suggestions newest first and filters by status", async () => {
  await addSuggestion(db, { kind: "add-distro", message: "Please add Foo Linux, it's on DistroWatch now.", subject: "foo" });
  await addSuggestion(db, { kind: "correction", message: "Mint is based on Ubuntu LTS, not Debian.", email: "a@example.com" });
  const all = await listSuggestions(db);
  expect(all.map((s) => s.kind)).toEqual(["correction", "add-distro"]);
  expect(all.every((s) => s.status === "new")).toBe(true);
  expect(await setSuggestionStatus(db, all[1]!.id, "done")).toBe(true);
  expect((await listSuggestions(db, "new")).map((s) => s.kind)).toEqual(["correction"]);
  expect(await setSuggestionStatus(db, 99999, "done")).toBe(false);
});
