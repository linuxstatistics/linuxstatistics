import { asc } from "drizzle-orm";
import type { Database } from "./client.js";
import { emailSignups } from "./schema.js";

export interface EmailSignupRow {
  id: number;
  email: string;
  source: string | null;
  createdAt: Date;
}

/** Record an email signup. Duplicate emails are a silent idempotent no-op. */
export async function addEmailSignup(
  db: Database,
  input: { email: string; source?: string | null },
): Promise<void> {
  await db
    .insert(emailSignups)
    .values({ email: input.email, source: input.source ?? null })
    .onConflictDoNothing({ target: emailSignups.email });
}

/** All signups, oldest first — for admin export. */
export async function listEmailSignups(db: Database): Promise<EmailSignupRow[]> {
  const rows = await db.select().from(emailSignups).orderBy(asc(emailSignups.createdAt));
  return rows as EmailSignupRow[];
}
