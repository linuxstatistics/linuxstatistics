import {
  addAlias,
  addPopularitySnapshot,
  findDistroIdByAlias,
  findDistroIdBySlug,
  findDistroSlugById,
  setDistroFamily,
  upsertDistro,
  writeCompositeIndex,
  type Database,
} from "@linux-statistics/db";
import { CURATED } from "./families.js";
import type { ParsedRanking } from "./sources/distrowatch.js";

export interface IngestResult {
  written: number;
  created: string[];
  /** Keys created without a curated family, for follow-up curation. */
  uncurated: string[];
  /** Distros ranked by the composite index after this write. */
  composite: number;
}

/**
 * Write parsed DistroWatch rows. Rows are matched by DistroWatch key through
 * the `distrowatch` alias, so our slug can differ from their key. A key we
 * don't know yet joins an existing distro with the same slug, else creates
 * one (slug = key). Curated families and bases, keyed by our slug, win; an
 * uncurated distro's existing family is never overwritten.
 */
export async function ingestDistrowatchRows(
  db: Database,
  rows: ParsedRanking[],
  capturedAt: Date,
): Promise<IngestResult> {
  const idByKey = new Map<string, number>();
  const slugById = new Map<number, string>();
  const created: string[] = [];
  const uncurated = new Set<string>();

  for (const r of rows) {
    let id = idByKey.get(r.key) ?? (await findDistroIdByAlias(db, "distrowatch", r.key));
    if (id === null || id === undefined) {
      const existing = await findDistroIdBySlug(db, r.key);
      if (existing !== null) {
        id = existing;
        await addAlias(db, "distrowatch", r.key, id);
      }
    }
    const slug = id != null ? (slugById.get(id) ?? (await findDistroSlugById(db, id)) ?? r.key) : r.key;
    const curated = CURATED[slug];
    if (id === null || id === undefined) {
      id = await upsertDistro(db, {
        slug,
        name: r.name,
        family: curated?.family ?? "other",
        basedOnSlug: curated?.basedOn ?? null,
        homepage: curated?.homepage ?? null,
        firstReleaseYear: curated?.firstReleaseYear ?? null,
        status: "active",
      });
      await addAlias(db, "distrowatch", r.key, id);
      created.push(slug);
    } else if (!idByKey.has(r.key) && curated) {
      await setDistroFamily(db, id, curated.family, curated.basedOn ?? null);
    }
    if (!curated) uncurated.add(slug);
    idByKey.set(r.key, id);
    slugById.set(id, slug);
    await addPopularitySnapshot(db, id, {
      source: "distrowatch",
      capturedAt,
      rank: r.rank,
      hitsPerDay: r.hitsPerDay,
      period: r.period,
    });
  }
  // DistroWatch is an input of the public rank; rebuild the composite at the same capture time.
  const composite = await writeCompositeIndex(db, capturedAt);
  return { written: rows.length, created, uncurated: [...uncurated], composite };
}
