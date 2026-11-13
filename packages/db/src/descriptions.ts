import { eq } from "drizzle-orm";
import type { Database } from "./client.js";
import { distros } from "./schema.js";

/** Valid summaries only; fetch failures and empty responses never clear previous text. */
export async function saveDistroDescription(db: Database, id: number, description: NonNullable<typeof distros.$inferInsert.description>): Promise<void> {
  if (!description.text.trim() || description.text.length > 12000 || !Number.isSafeInteger(description.revisionId) || description.revisionId < 1) throw new Error("Invalid distro description");
  await db.update(distros).set({ description }).where(eq(distros.id, id));
}
