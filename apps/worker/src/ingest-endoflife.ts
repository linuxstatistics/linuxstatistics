import { findDistroIdBySlug, replaceDistroReleases, type Database } from "@linux-statistics/db";
import { politeGet, StopError, type FetchLike } from "./http.js";
import { ENDOFLIFE_PRODUCTS, parseEndoflife, productUrl } from "./sources/endoflife.js";

export interface EndoflifeIngestResult {
  products: number;
  written: number;
  cycles: number;
  failed: { slug: string; product: string; error: string }[];
}

/**
 * Release cycles from endoflife.date for the distros in ENDOFLIFE_PRODUCTS.
 * One request per product, paced; each product is parsed fully before its rows
 * are replaced, and a failure leaves that distro's last good rows in place.
 */
export async function ingestEndoflife(db: Database, opts: { fetch?: FetchLike; paceMs?: number; backoffMs?: number } = {}): Promise<EndoflifeIngestResult> {
  const entries = Object.entries(ENDOFLIFE_PRODUCTS);
  const result: EndoflifeIngestResult = { products: entries.length, written: 0, cycles: 0, failed: [] };
  // Pace real requests; tests inject fetch and skip the wait.
  const pace = opts.paceMs ?? (opts.fetch ? 0 : 300);
  for (const [slug, product] of entries) {
    try {
      const id = await findDistroIdBySlug(db, slug);
      if (id == null) throw new Error("slug not in catalogue");
      const res = await politeGet(productUrl(product), { fetch: opts.fetch, headers: { Accept: "application/json" }, backoffMs: opts.backoffMs });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = parseEndoflife(await res.json());
      result.cycles += await replaceDistroReleases(db, id, "endoflife", rows);
      result.written++;
    } catch (err) {
      if (err instanceof StopError) throw err;
      result.failed.push({ slug, product, error: err instanceof Error ? err.message : String(err) });
    }
    if (pace > 0) await new Promise((r) => setTimeout(r, pace));
  }
  if (result.written === 0 && entries.length) throw new Error(`all ${entries.length} products failed`);
  return result;
}
