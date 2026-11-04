import {
  addDistrowatchSnapshot,
  defaultPgliteDir,
  initPgliteDb,
  recordIngestionRun,
  upsertDistro,
  type Database,
} from "@linux-statistics/db";
import { parseDistrowatchRanking } from "./sources/distrowatch.js";

const DW_URL = "https://distrowatch.com/dwres.php?resource=popularity";
const USER_AGENT = "linux-statistics-bot/0.1 (+https://linuxstatistics.com)";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Live DistroWatch ingestion. On any failure it records a failed run and throws
 * to the caller, which logs but does NOT clear existing data — so a transient
 * outage or layout change never destroys the last good snapshot.
 */
async function ingestDistrowatch(db: Database): Promise<number> {
  const res = await fetch(DW_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`DistroWatch HTTP ${res.status}`);
  const html = await res.text();
  const rows = parseDistrowatchRanking(html);
  const capturedAt = new Date();
  let written = 0;
  for (const r of rows) {
    // Family is enriched separately via a curated mapping; default to "other".
    const id = await upsertDistro(db, {
      slug: slugify(r.name),
      name: r.name,
      family: "other",
      status: "active",
    });
    await addDistrowatchSnapshot(db, id, {
      capturedAt,
      rank: r.rank,
      hitsPerDay: r.hitsPerDay,
      period: r.period,
    });
    written += 1;
  }
  return written;
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
