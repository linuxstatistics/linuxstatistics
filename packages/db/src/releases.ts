import { and, desc, eq } from "drizzle-orm";
import type { ReleaseCycle } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import { distroReleases } from "./schema.js";

/** Replace a distro's release cycles from one source (whole set, so dropped cycles disappear). */
export async function replaceDistroReleases(db: Database, distroId: number, source: string, rows: ReleaseCycle[]): Promise<number> {
  await db.delete(distroReleases).where(and(eq(distroReleases.distroId, distroId), eq(distroReleases.source, source)));
  for (const r of rows) await db.insert(distroReleases).values({ distroId, source, ...r });
  return rows.length;
}

/** A distro's release cycles, newest first. */
export async function getDistroReleases(db: Database, distroId: number): Promise<ReleaseCycle[]> {
  const rows = await db.select().from(distroReleases).where(eq(distroReleases.distroId, distroId)).orderBy(desc(distroReleases.releasedOn));
  return rows.map(({ cycle, codename, releasedOn, latest, latestOn, supportEnds, eol, lts }) => ({ cycle, codename, releasedOn, latest, latestOn, supportEnds, eol, lts }));
}
