import {
  addAlias,
  addDistrowatchSnapshot,
  findDistroIdByAlias,
  setDistroFamily,
  upsertDistro,
  type Database,
} from "@linux-statistics/db";
import { CURATED } from "./families.js";
import type { ParsedRanking } from "./sources/distrowatch.js";

export interface IngestResult {
  written: number;
  created: string[];
  /** Keys created without a curated family, for follow-up curation. */
  uncurated: string[];
}

/**
 * Write parsed DistroWatch rows. Distros are matched only by DistroWatch key
 * (which is also our slug). New distros are created; curated families and
 * bases win; an uncurated distro's existing family is never overwritten.
 */
export async function ingestDistrowatchRows(
  db: Database,
  rows: ParsedRanking[],
  capturedAt: Date,
): Promise<IngestResult> {
  const idByKey = new Map<string, number>();
  const created: string[] = [];
  const uncurated = new Set<string>();

  for (const r of rows) {
    let id = idByKey.get(r.key) ?? (await findDistroIdByAlias(db, "distrowatch", r.key));
    const curated = CURATED[r.key];
    if (id === null || id === undefined) {
      id = await upsertDistro(db, {
        slug: r.key,
        name: r.name,
        family: curated?.family ?? "other",
        basedOnSlug: curated?.basedOn ?? null,
        homepage: curated?.homepage ?? null,
        firstReleaseYear: curated?.firstReleaseYear ?? null,
        status: "active",
      });
      await addAlias(db, "distrowatch", r.key, id);
      created.push(r.key);
    } else if (!idByKey.has(r.key) && curated) {
      await setDistroFamily(db, id, curated.family, curated.basedOn ?? null);
    }
    if (!curated) uncurated.add(r.key);
    idByKey.set(r.key, id);
    await addDistrowatchSnapshot(db, id, {
      capturedAt,
      rank: r.rank,
      hitsPerDay: r.hitsPerDay,
      period: r.period,
    });
  }
  return { written: rows.length, created, uncurated: [...uncurated] };
}
