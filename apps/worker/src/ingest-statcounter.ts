import { upsertMarketShare, type Database } from "@linux-statistics/db";
import { parseStatcounterCsv, statcounterCsvUrl } from "./sources/statcounter.js";
import { politeGet, type FetchLike } from "./http.js";

function monthStr(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Fetch desktop OS market share (worldwide, monthly) and upsert it. The default
 * window is the last 3 complete months; `backfill` fetches from 2009-01. The
 * current, unfinished month is skipped (StatCounter publishes it as it goes,
 * and a few days of data swing wildly). Rows are written only after the whole
 * CSV parses.
 */
export async function ingestStatcounter(
  db: Database,
  opts: { fetch?: FetchLike; now?: Date; backfill?: boolean } = {},
): Promise<number> {
  const now = opts.now ?? new Date();
  const to = monthStr(now);
  const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
  const from = opts.backfill ? "2009-01" : monthStr(fromDate);
  const res = await politeGet(statcounterCsvUrl("ww", from, to), { fetch: opts.fetch });
  if (!res.ok) throw new Error(`StatCounter HTTP ${res.status}`);
  const current = monthStr(now);
  const rows = parseStatcounterCsv(await res.text()).filter((r) => r.date < current);
  if (rows.length === 0) throw new Error("StatCounter CSV has no complete months in range");
  for (const r of rows) {
    const [y, m] = r.date.split("-").map(Number);
    if (!y || !m) throw new Error(`StatCounter row has a bad date "${r.date}"`);
    await upsertMarketShare(db, {
      capturedAt: new Date(Date.UTC(y, m - 1, 1)),
      region: "global",
      platform: r.platform,
      sharePct: r.sharePct,
    });
  }
  return rows.length;
}
