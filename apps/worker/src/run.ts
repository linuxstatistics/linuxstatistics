import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { openDb } from "@linux-statistics/db";
import { runSources, SOURCES, type Source } from "./sources-run.js";

const USAGE = `Usage: ingest [--source distrowatch|github|statcounter|wikidata|wikipedia|all ...] [--backfill] [--rebuild]
  --source    one or more sources (repeat or comma-separate); default: all
  --backfill  StatCounter: fetch full history from 2009-01
  --rebuild   after at least one source succeeds, run build-site (needs the API running)`;

function parseArgs(argv: string[]) {
  const sources = new Set<Source>();
  let backfill = false;
  let rebuild = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--backfill") backfill = true;
    else if (a === "--rebuild") rebuild = true;
    else if (a === "--help" || a === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else if (a === "--source" || a.startsWith("--source=")) {
      const v = a.includes("=") ? a.split("=")[1]! : argv[++i];
      if (!v) throw new Error("--source needs a value");
      for (const s of v.split(",")) {
        if (s === "all") SOURCES.forEach((x) => sources.add(x));
        else if ((SOURCES as readonly string[]).includes(s)) sources.add(s as Source);
        else throw new Error(`Unknown source "${s}". ${USAGE}`);
      }
    } else throw new Error(`Unknown argument "${a}". ${USAGE}`);
  }
  return { sources: sources.size ? [...sources] : [...SOURCES], backfill, rebuild };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  // Production: DATABASE_URL (Postgres, shared with the API). Local: PGlite,
  // which is single-connection, so stop the API before ingesting locally.
  const { db, close } = await openDb({ max: 2 });
  let status;
  try {
    status = await runSources(db, args.sources, { backfill: args.backfill });
  } finally {
    await close();
  }
  const failed = args.sources.filter((s) => status[s] === "failed");
  const succeeded = args.sources.filter((s) => status[s] === "success");
  if (args.rebuild && succeeded.length) {
    const script = resolve(dirname(fileURLToPath(import.meta.url)), "../../../scripts/build-site.sh");
    const r = spawnSync("bash", [script], { stdio: "inherit" });
    if (r.status !== 0) {
      console.error("build-site failed; the previous site is still live");
      process.exitCode = 1;
    }
  }
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});
