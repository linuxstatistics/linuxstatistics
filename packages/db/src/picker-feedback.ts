import { asc, count, eq, sql } from "drizzle-orm";
import type { Database } from "./client.js";
import { pickerFeedback } from "./schema.js";

export interface PickerFeedbackRow {
  id: number;
  topKey: string;
  code: string;
  fit: boolean;
  day: string;
}

/** Record one anonymous vote. `day` is the UTC date (YYYY-MM-DD); nothing else about the visitor is stored. */
export async function addPickerFeedback(
  db: Database,
  input: { topKey: string; code: string; fit: boolean },
  now: Date = new Date(),
): Promise<void> {
  await db.insert(pickerFeedback).values({ ...input, day: now.toISOString().slice(0, 10) });
}

/** All votes, oldest first — for admin export. */
export async function listPickerFeedback(db: Database): Promise<PickerFeedbackRow[]> {
  return db
    .select({ id: pickerFeedback.id, topKey: pickerFeedback.topKey, code: pickerFeedback.code, fit: pickerFeedback.fit, day: pickerFeedback.day })
    .from(pickerFeedback)
    .orderBy(asc(pickerFeedback.id));
}

/** Fit votes for one distro as the quiz's top pick. */
export async function getPickerFit(db: Database, topKey: string): Promise<{ up: number; total: number }> {
  const [row] = await db
    .select({ total: count(), up: sql<number>`count(*) filter (where ${pickerFeedback.fit})`.mapWith(Number) })
    .from(pickerFeedback)
    .where(eq(pickerFeedback.topKey, topKey));
  return { up: row?.up ?? 0, total: row?.total ?? 0 };
}
