import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  addAlias,
  addPopularitySnapshot,
  addGithubSnapshot,
  addMarketShare,
  findDistroIdByAlias,
  findDistroIdBySlug,
  openDb,
  recordIngestionRun,
  writeCompositeIndex,
  schema,
  upsertGithubRepo,
} from "@linux-statistics/db";
import { parseDistrowatchRanking } from "./sources/distrowatch.js";
import { ingestDistrowatchRows } from "./ingest-distrowatch.js";
import {
  LEGACY_SLUGS,
  MARKET_SHARE,
  SEED_CAPTURED_AT,
  SEED_CAPTURE,
  SEED_FALLBACK,
  SEED_REPOS,
} from "./seed-data.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const YEAR_AGO = new Date(SEED_CAPTURED_AT.getTime() - 365 * 24 * 3600 * 1000);

async function main(): Promise<void> {
  const { db, close, kind } = await openDb({ max: 2 });

  // Reset for a clean, repeatable seed (cascade clears snapshots, repos, aliases).
  await db.delete(schema.marketShare);
  await db.delete(schema.ingestionRuns);
  await db.delete(schema.distros);

  const capture = resolve(root, SEED_CAPTURE);
  const page = existsSync(capture) ? capture : resolve(root, SEED_FALLBACK);
  const rows = parseDistrowatchRanking(readFileSync(page, "utf8"));
  const result = await ingestDistrowatchRows(db, rows, SEED_CAPTURED_AT);

  // A year-ago 12-month snapshot so the trend column has something to compare:
  // use the 6-month rank as a stand-in (illustrative, not a real capture).
  const sixMonth = rows.filter((r) => r.period === "last-6-months");
  for (const r of sixMonth) {
    const id = await findDistroIdByAlias(db, "distrowatch", r.key);
    if (id) {
      await addPopularitySnapshot(db, id, {
        source: "distrowatch",
        capturedAt: YEAR_AGO,
        rank: r.rank,
        hitsPerDay: r.hitsPerDay,
        period: "last-12-months",
      });
    }
  }

  for (const [legacy, key] of Object.entries(LEGACY_SLUGS)) {
    const id = await findDistroIdBySlug(db, key);
    if (id) await addAlias(db, "legacy", legacy, id);
  }

  for (const repo of SEED_REPOS) {
    const id = await findDistroIdBySlug(db, repo.key);
    if (!id) continue;
    const repoId = await upsertGithubRepo(db, id, {
      repoFullName: repo.fullName,
      stars: repo.stars,
      forks: repo.forks,
      openIssues: repo.openIssues,
    });
    await addGithubSnapshot(db, repoId, {
      capturedAt: SEED_CAPTURED_AT,
      stars: repo.stars,
      commitsLast30d: repo.commits30d,
      contributors: repo.contributors,
    });
  }

  for (const point of MARKET_SHARE) {
    const capturedAt = new Date(Date.UTC(point.year, 0, 1));
    await addMarketShare(db, { capturedAt, region: "global", platform: "linux", sharePct: point.linux });
    await addMarketShare(db, { capturedAt, region: "global", platform: "windows", sharePct: point.windows });
    await addMarketShare(db, { capturedAt, region: "global", platform: "macos", sharePct: point.macos });
  }

  // GitHub rows were added after the ranking rows; rebuild the composite so it sees them.
  const composite = await writeCompositeIndex(db, SEED_CAPTURED_AT);
  await recordIngestionRun(db, "distrowatch", "success", result.written);
  await recordIngestionRun(db, "statcounter", "success", MARKET_SHARE.length * 3);
  await recordIngestionRun(db, "github", "success", SEED_REPOS.length);

  await close();
  console.log(
    `Seeded ${result.created.length} distros (${result.written} ranking rows from ${page === capture ? "local capture" : "synthetic page"}, ${result.uncurated.length} without a curated family, composite index for ${composite}) into ${kind}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
