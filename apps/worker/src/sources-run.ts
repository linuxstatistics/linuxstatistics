import { recordIngestionRun, type Database } from "@linux-statistics/db";
import { parseDistrowatchRanking } from "./sources/distrowatch.js";
import { ingestDistrowatchRows } from "./ingest-distrowatch.js";
import { ingestStatcounter } from "./ingest-statcounter.js";
import { ingestGithub } from "./ingest-github.js";
import { ingestWikidataDistros } from "./ingest-wikidata.js";
import { ingestWikipedia } from "./ingest-wikipedia.js";
import { ingestEndoflife } from "./ingest-endoflife.js";
import { ingestDescriptions } from "./ingest-descriptions.js";
import { WIKIDATA_ENDPOINT, WIKIDATA_SPARQL, parseWikidataDistros } from "./sources/wikidata.js";
import { WIKIDATA_FACTS_SPARQL, parseWikidataFacts } from "./sources/wikidata-facts.js";
import { applyAllCuratedFacts, ingestFacts } from "./ingest-facts.js";
import { politeGet, type FetchLike } from "./http.js";

export const SOURCES = ["distrowatch", "github", "statcounter", "wikidata", "wikipedia", "endoflife", "descriptions"] as const;
export type Source = (typeof SOURCES)[number];

const DW_URL = "https://distrowatch.com/dwres.php?resource=popularity";

export interface RunOptions {
  fetch?: FetchLike;
  now?: Date;
  backfill?: boolean;
  log?: (msg: string) => void;
}

async function runOne(db: Database, source: Source, opts: RunOptions): Promise<number> {
  const log = opts.log ?? console.log;
  switch (source) {
    case "descriptions": return ingestDescriptions(db, { fetch: opts.fetch, now: opts.now, log });
    case "distrowatch": {
      const res = await politeGet(DW_URL, { fetch: opts.fetch });
      if (!res.ok) throw new Error(`DistroWatch HTTP ${res.status}`);
      // Parse everything before writing anything (C-01).
      const rows = parseDistrowatchRanking(await res.text());
      const r = await ingestDistrowatchRows(db, rows, opts.now ?? new Date());
      if (r.created.length) log(`distrowatch: ${r.created.length} new distros: ${r.created.slice(0, 10).join(", ")}`);
      if (r.uncurated.length) log(`distrowatch: ${r.uncurated.length} distros without a curated family`);
      log(`distrowatch: composite index rebuilt for ${r.composite} distros`);
      return r.written;
    }
    case "statcounter":
      return ingestStatcounter(db, { fetch: opts.fetch, now: opts.now, backfill: opts.backfill });
    case "wikidata": {
      const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(WIKIDATA_SPARQL)}`;
      const res = await politeGet(url, { fetch: opts.fetch, headers: { Accept: "application/sparql-results+json" } });
      if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
      // Parse everything before writing anything (C-01).
      const items = parseWikidataDistros(await res.json());
      const r = await ingestWikidataDistros(db, items);
      log(`wikidata: ${items.length} items, ${r.matched} matched, ${r.discovered.length} discovered (unlisted), ${r.filled.length} blanks filled`);
      for (const c of r.conflicts) log(`wikidata: kept ours for ${c}`);
      for (const x of r.rejected) log(`wikidata: not matched ${x}`);
      // Desktop and package-manager facts: a second query, after the matching
      // above wrote the aliases it relies on.
      const fres = await politeGet(`${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(WIKIDATA_FACTS_SPARQL)}`, { fetch: opts.fetch, headers: { Accept: "application/sparql-results+json" } });
      if (!fres.ok) throw new Error(`Wikidata facts HTTP ${fres.status} (distro matches saved, earlier facts kept)`);
      const f = await ingestFacts(db, parseWikidataFacts(await fres.json()));
      log(`wikidata: ${f.filled.length} fact blanks filled`);
      return r.matched + r.discovered.length;
    }
    case "wikipedia": {
      const r = await ingestWikipedia(db, { fetch: opts.fetch, now: opts.now });
      for (const f of r.failed) log(`wikipedia: ${f.slug} (${f.title}) skipped: ${f.error}`);
      log(`wikipedia: ${r.written}/${r.articles} articles to ${r.month}; interest index ranks ${r.ranked} distros, composite ${r.composite}`);
      return r.written;
    }
    case "endoflife": {
      const r = await ingestEndoflife(db, { fetch: opts.fetch });
      for (const f of r.failed) log(`endoflife: ${f.slug} (${f.product}) skipped: ${f.error}`);
      log(`endoflife: ${r.written}/${r.products} products, ${r.cycles} cycles`);
      return r.cycles;
    }
    case "github": {
      const r = await ingestGithub(db, { fetch: opts.fetch, now: opts.now });
      for (const f of r.failed) log(`github: ${f.repo} skipped (${f.error})`);
      if (r.written === 0 && r.failed.length) throw new Error(`all ${r.failed.length} repos failed`);
      return r.written;
    }
  }
}

/**
 * Run each source in isolation. A failure is recorded as a failed run and
 * never stops the other sources or touches their data.
 */
export async function runSources(
  db: Database,
  sources: readonly Source[],
  opts: RunOptions = {},
): Promise<Record<Source, "success" | "failed" | "skipped">> {
  const log = opts.log ?? console.log;
  const status = Object.fromEntries(SOURCES.map((s) => [s, "skipped"])) as Record<
    Source,
    "success" | "failed" | "skipped"
  >;
  // Hand-checked distro facts ship with the code; apply them on every run so a
  // deploy reaches the database without waiting for a source. Idempotent.
  try {
    const n = (await applyAllCuratedFacts(db)).length;
    log(`facts: curated facts for ${n} distros`);
  } catch (err) {
    log(`facts: curated facts not applied: ${err instanceof Error ? err.message : String(err)}`);
  }
  for (const source of sources) {
    try {
      const n = await runOne(db, source, opts);
      await recordIngestionRun(db, source, "success", n);
      log(`${source}: wrote ${n} rows`);
      status[source] = "success";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await recordIngestionRun(db, source, "failed", 0, msg);
      log(`${source}: FAILED (previous data kept): ${msg}`);
      status[source] = "failed";
    }
  }
  return status;
}
