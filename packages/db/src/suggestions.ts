import { desc, eq } from "drizzle-orm";
import type { Database } from "./client.js";
import { suggestions } from "./schema.js";

export type SuggestionStatus = "new" | "done" | "dismissed";

export interface SuggestionRow {
  id: number;
  kind: string;
  subject: string | null;
  message: string;
  email: string | null;
  userId: number | null;
  status: SuggestionStatus;
  createdAt: Date;
}

export async function addSuggestion(
  db: Database,
  input: { kind: string; message: string; subject?: string | null; email?: string | null; userId?: number | null },
): Promise<void> {
  await db.insert(suggestions).values({
    kind: input.kind,
    message: input.message,
    subject: input.subject ?? null,
    email: input.email ?? null,
    userId: input.userId ?? null,
  });
}

/** Newest first; optionally only one status. */
export async function listSuggestions(db: Database, status?: SuggestionStatus): Promise<SuggestionRow[]> {
  const q = db.select().from(suggestions);
  const rows = status ? await q.where(eq(suggestions.status, status)).orderBy(desc(suggestions.createdAt)) : await q.orderBy(desc(suggestions.createdAt));
  return rows as SuggestionRow[];
}

export async function setSuggestionStatus(db: Database, id: number, status: SuggestionStatus): Promise<boolean> {
  const r = await db.update(suggestions).set({ status }).where(eq(suggestions.id, id)).returning({ id: suggestions.id });
  return r.length > 0;
}
