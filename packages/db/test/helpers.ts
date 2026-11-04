import { initPgliteDb } from "../src/client.js";

/** Create a fresh, migrated, in-memory PGlite database for a test file. */
export async function setupTestDb() {
  return initPgliteDb();
}
