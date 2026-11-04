import { defaultPgliteDir, initPgliteDb, recordIngestionRun, type Database } from "@linux-statistics/db";
import { parseDistrowatchRanking } from "./sources/distrowatch.js";
import { ingestDistrowatchRows } from "./ingest-distrowatch.js";

const DW_URL = "https://distrowatch.com/dwres.php?resource=popularity";
const USER_AGENT = "linux-statistics-bot/0.1 (+https://linuxstatistics.com)";

/**
 * Live DistroWatch ingestion. The page is parsed fully before anything is
 * written, so a layout change fails the run without touching existing data.
 */
async function ingestDistrowatch(db: Database): Promise<number> {
  const res = await fetch(DW_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`DistroWatch HTTP ${res.status}`);
  const rows = parseDistrowatchRanking(await res.text());
  const result = await ingestDistrowatchRows(db, rows, new Date());
  if (result.created.length) console.log(`DistroWatch: ${result.created.length} new distros`);
  if (result.uncurated.length) {
    console.log(`DistroWatch: ${result.uncurated.length} distros without a curated family (see apps/worker/src/families.ts)`);
  }
  return result.written;
}

async function main(): Promise<void> {
  const { db, client } = await initPgliteDb(defaultPgliteDir());
  try {
    const n = await ingestDistrowatch(db);
    await recordIngestionRun(db, "distrowatch", "success", n);
    console.log(`DistroWatch: wrote ${n} rows`);
  } catch (err) {
    await recordIngestionRun(db, "distrowatch", "failed", 0, String(err));
    console.error("DistroWatch ingestion failed (previous data preserved):", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
