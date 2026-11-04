import {
  addDistrowatchSnapshot,
  addGithubSnapshot,
  addMarketShare,
  defaultPgliteDir,
  initPgliteDb,
  recordIngestionRun,
  schema,
  upsertDistro,
  upsertGithubRepo,
} from "@linux-statistics/db";
import { MARKET_SHARE, TAIL_DISTROS, TOP_DISTROS, type SeedDistro } from "./seed-data.js";

const NOW = new Date("2026-06-01T00:00:00.000Z");
const YEAR_AGO = new Date("2025-06-01T00:00:00.000Z");
const PERIOD = "last-12-months";

async function seedDistro(
  db: Awaited<ReturnType<typeof initPgliteDb>>["db"],
  d: SeedDistro,
): Promise<void> {
  const id = await upsertDistro(db, {
    slug: d.slug,
    name: d.name,
    family: d.family,
    basedOnSlug: d.basedOnSlug ?? null,
    homepage: d.homepage ?? null,
    logoUrl: null,
    firstReleaseYear: d.firstReleaseYear ?? null,
    status: "active",
  });
  await addDistrowatchSnapshot(db, id, { capturedAt: YEAR_AGO, rank: d.rankPrev, hitsPerDay: Math.round(d.hits * 0.9), period: PERIOD });
  await addDistrowatchSnapshot(db, id, { capturedAt: NOW, rank: d.rank, hitsPerDay: d.hits, period: PERIOD });
  if (d.repo) {
    const repoId = await upsertGithubRepo(db, id, {
      repoFullName: d.repo.fullName,
      stars: d.repo.stars,
      forks: d.repo.forks,
      openIssues: d.repo.openIssues,
    });
    await addGithubSnapshot(db, repoId, {
      capturedAt: NOW,
      stars: d.repo.stars,
      commitsLast30d: d.repo.commits30d,
      contributors: d.repo.contributors,
    });
  }
}

async function main(): Promise<void> {
  const dir = defaultPgliteDir();
  const { db, client } = await initPgliteDb(dir);

  // Reset for a clean, repeatable seed (cascade clears snapshots/repos).
  await db.delete(schema.marketShare);
  await db.delete(schema.ingestionRuns);
  await db.delete(schema.distros);

  for (const d of [...TOP_DISTROS, ...TAIL_DISTROS]) {
    await seedDistro(db, d);
  }

  for (const point of MARKET_SHARE) {
    const capturedAt = new Date(Date.UTC(point.year, 0, 1));
    await addMarketShare(db, { capturedAt, region: "global", platform: "linux", sharePct: point.linux });
    await addMarketShare(db, { capturedAt, region: "global", platform: "windows", sharePct: point.windows });
    await addMarketShare(db, { capturedAt, region: "global", platform: "macos", sharePct: point.macos });
  }

  const distroCount = TOP_DISTROS.length + TAIL_DISTROS.length;
  await recordIngestionRun(db, "distrowatch", "success", distroCount);
  await recordIngestionRun(db, "statcounter", "success", MARKET_SHARE.length * 3);
  await recordIngestionRun(db, "github", "success", TOP_DISTROS.filter((d) => d.repo).length);

  await client.close();
  console.log(`Seeded ${distroCount} distros and ${MARKET_SHARE.length} market-share years into ${dir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
