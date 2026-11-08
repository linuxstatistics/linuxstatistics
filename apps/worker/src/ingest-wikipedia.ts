import {
  addAlias,
  findDistroIdBySlug,
  listEnwikiTitles,
  monthMinus,
  upsertPageviewMonths,
  writeCompositeIndex,
  writeInterestIndex,
  type Database,
} from "@linux-statistics/db";
import { ENWIKI_PINS } from "./families.js";
import { politeGet, StopError, type FetchLike } from "./http.js";
import { lastFullMonth, pageviewsUrl, parsePageviews } from "./sources/wikipedia.js";

export interface WikipediaIngestResult {
  articles: number;
  /** Articles fetched and stored. */
  written: number;
  /** Articles that failed, with the reason; the others still count. */
  failed: { slug: string; title: string; error: string }[];
  /** Month the index was built up to. */
  month: string;
  /** Distros ranked over 12 months. */
  ranked: number;
  /** Distros ranked by the composite index over 12 months. */
  composite: number;
}

/**
 * Fetch 12 full months of English Wikipedia views for every distro with an
 * `enwiki` alias (from Wikidata, plus hand pins), one request at a time and
 * paced (default 400 ms apart, ~150/minute), then rebuild our "interest" index. A 404 (article renamed or deleted) is
 * recorded and skipped; a 403/429 stops the run. If most articles fail, the
 * index isn't rebuilt (the last good one stays).
 */
export async function ingestWikipedia(
  db: Database,
  opts: { fetch?: FetchLike; now?: Date; months?: number; delayMs?: number } = {},
): Promise<WikipediaIngestResult> {
  // Wikimedia allows 200 requests/minute for an identified bot; stay well under.
  const delayMs = opts.delayMs ?? (opts.fetch ? 0 : 400);
  for (const [slug, title] of Object.entries(ENWIKI_PINS)) {
    const id = await findDistroIdBySlug(db, slug);
    if (id != null) await addAlias(db, "enwiki", title, id);
  }

  const to = lastFullMonth(opts.now ?? new Date());
  const from = monthMinus(to, (opts.months ?? 12) - 1);
  const titles = await listEnwikiTitles(db);
  const result: WikipediaIngestResult = { articles: titles.length, written: 0, failed: [], month: to, ranked: 0, composite: 0 };

  for (const [i, t] of titles.entries()) {
    if (i > 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const res = await politeGet(pageviewsUrl(t.title, from, to), { fetch: opts.fetch, retries: 1, backoffMs: 1000 });
      if (res.status === 404) throw new Error("no views (404)");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const months = parsePageviews(await res.json());
      await upsertPageviewMonths(db, "enwiki", t.distroId, months);
      result.written += 1;
    } catch (err) {
      if (err instanceof StopError) throw err;
      result.failed.push({ slug: t.slug, title: t.title, error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (titles.length > 0 && result.written < titles.length / 2) {
    throw new Error(`only ${result.written} of ${titles.length} articles fetched; index not rebuilt`);
  }
  result.ranked = await writeInterestIndex(db, to);
  // The composite rank combines interest with the other inputs; rebuild it on the same capture date.
  const [y, m] = to.split("-").map(Number) as [number, number];
  result.composite = await writeCompositeIndex(db, new Date(Date.UTC(y, m, 1)));
  return result;
}
