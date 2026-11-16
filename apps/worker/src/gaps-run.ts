import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { collectReport, reportMarkdown } from "./gaps.js";

const USAGE = `Usage: gaps [--top N] [--out FILE.json]
  Reads the API (API_URL, default http://localhost:3001), endoflife.date and
  Wikidata, and prints which ranked distros are missing data, plus proposals
  to review. Writes nothing to the database or curated files.
  --top N         ranked distros to check (default 200)
  --out FILE.json also write the full report as JSON
  In GitHub Actions the summary is added to the run page.`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) return console.log(USAGE);
  const arg = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const api = (process.env.API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const report = await collectReport({ api, top: Number(arg("top") ?? 200), log: console.error });
  const md = reportMarkdown(report);
  console.log(md);
  const out = arg("out");
  if (out) {
    mkdirSync(dirname(resolve(out)), { recursive: true });
    writeFileSync(resolve(out), `${JSON.stringify(report, null, 2)}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
