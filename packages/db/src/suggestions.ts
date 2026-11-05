import { desc, eq } from "drizzle-orm";
import type { Database } from "./client.js";
import { suggestions, users } from "./schema.js";

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
  /** Sign-in name of the sender, when they were signed in. */
  username: string | null;
  provider: string | null;
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

/** Newest first; optionally only one status. Includes the sender's sign-in name if any. */
export async function listSuggestions(db: Database, status?: SuggestionStatus): Promise<SuggestionRow[]> {
  const q = db
    .select({
      id: suggestions.id,
      kind: suggestions.kind,
      subject: suggestions.subject,
      message: suggestions.message,
      email: suggestions.email,
      userId: suggestions.userId,
      status: suggestions.status,
      createdAt: suggestions.createdAt,
      username: users.username,
      provider: users.provider,
    })
    .from(suggestions)
    .leftJoin(users, eq(users.id, suggestions.userId));
  const rows = status
    ? await q.where(eq(suggestions.status, status)).orderBy(desc(suggestions.createdAt), desc(suggestions.id))
    : await q.orderBy(desc(suggestions.createdAt), desc(suggestions.id));
  return rows as SuggestionRow[];
}

export async function deleteSuggestion(db: Database, id: number): Promise<boolean> {
  const r = await db.delete(suggestions).where(eq(suggestions.id, id)).returning({ id: suggestions.id });
  return r.length > 0;
}

export async function setSuggestionStatus(db: Database, id: number, status: SuggestionStatus): Promise<boolean> {
  const r = await db.update(suggestions).set({ status }).where(eq(suggestions.id, id)).returning({ id: suggestions.id });
  return r.length > 0;
}
