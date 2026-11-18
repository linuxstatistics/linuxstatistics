import { applyCuratedFacts, fillFactBlanks, findDistroIdByAlias, findDistroIdBySlug, type Database } from "@linux-statistics/db";
import { CURATED_FACTS } from "./distro-facts.js";
import type { WikidataFacts } from "./sources/wikidata-facts.js";

/** Write every curated entry for distros we have. Returns the slugs written. */
export async function applyAllCuratedFacts(db: Database): Promise<string[]> {
  const done: string[] = [];
  for (const [slug, f] of Object.entries(CURATED_FACTS)) {
    const id = await findDistroIdBySlug(db, slug);
    if (id == null) continue;
    await applyCuratedFacts(db, id, {
      defaultDesktop: f.default,
      otherDesktops: f.others ?? [],
      editions: f.editions ?? [],
      packageManager: f.pkg,
      init: f.init,
      sourceUrl: f.source,
    });
    done.push(slug);
  }
  return done;
}

export interface FactsIngestResult {
  /** Fields filled from Wikidata, as "qid.field" for distros without curated values. */
  filled: string[];
}

/**
 * Wikidata fills empty fields of distros already matched to an item (through
 * the `wikidata` alias the main Wikidata ingest writes). Curated values,
 * applied on every run, always win. Never creates distros.
 */
export async function ingestFacts(db: Database, items: WikidataFacts[]): Promise<FactsIngestResult> {
  const filled: string[] = [];
  for (const it of items) {
    const id = await findDistroIdByAlias(db, "wikidata", it.qid);
    if (id == null) continue;
    for (const f of await fillFactBlanks(db, id, "wikidata", { desktops: it.desktops, packageManager: it.packageManager })) filled.push(`${it.qid}.${f}`);
  }
  return { filled };
}
