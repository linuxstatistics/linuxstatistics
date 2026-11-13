import { listEnwikiTitles, aliasesFor, saveDistroDescription, type Database } from "@linux-statistics/db";
import { ENWIKI_PINS, WIKIDATA_PINS } from "./families.js";
import { politeGet, StopError, type FetchLike } from "./http.js";
import { descriptionUrl, parseDescription } from "./sources/descriptions.js";

/** Weekly cached introductions. No title guessing, runtime scraping, or clearing good text on failures. */
export async function ingestDescriptions(db: Database, opts: { fetch?: FetchLike; now?: Date; delayMs?: number; log?: (msg: string) => void } = {}): Promise<number> {
  const aliases = await listEnwikiTitles(db);
  // Prefer an explicit editorial pin; otherwise choose a stable title, not database row order.
  const canonical = new Map<number, typeof aliases[number]>();
  for (const item of [...aliases].sort((a, b) => Number(b.title === ENWIKI_PINS[b.slug]) - Number(a.title === ENWIKI_PINS[a.slug]) || a.title.localeCompare(b.title))) {
    if (!canonical.has(item.distroId)) canonical.set(item.distroId, item);
  }
  const titles = [...canonical.values()];
  const delayMs = opts.delayMs ?? (opts.fetch ? 0 : 700);
  const fetchWithTimeout: FetchLike = opts.fetch ?? ((url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }));
  let written = 0;
  for (const [i, item] of titles.entries()) {
    if (i && delayMs) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const response = await politeGet(descriptionUrl(item.title), { fetch: fetchWithTimeout, retries: 1 });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const wikidata = (await aliasesFor(db, item.distroId)).filter((a) => a.source === "wikidata").map((a) => a.alias);
      const expected = WIKIDATA_PINS[item.slug] ?? (wikidata.length === 1 ? wikidata[0] : undefined);
      if (!expected && item.title !== ENWIKI_PINS[item.slug]) throw new Error("No verified item identity or editorial article pin");
      const description = parseDescription(await response.json(), expected);
      await saveDistroDescription(db, item.distroId, { ...description, fetchedAt: (opts.now ?? new Date()).toISOString() });
      written++;
    } catch (error) {
      if (error instanceof StopError) throw error;
      opts.log?.(`descriptions: ${item.slug} skipped; cached text kept: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (titles.length && written < titles.length / 2) throw new Error(`Only ${written}/${titles.length} descriptions fetched; previous descriptions kept`);
  return written;
}
