import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DistroListItem, MarketSharePoint, Meta } from "@linux-statistics/shared";
import { KINDS, moversCard, shareCard, statCard, topCard, type CardInput, type Kind } from "./kinds.js";
import { SIZES, toPng, type Size } from "./render.js";

const USAGE = `Usage: card --kind top|movers|share|stat [options]
  Renders a social image from the API (API_URL, default http://localhost:3001).

  --size landscape|square   1200x630 (default) or 1080x1080
  --count N                 rows for top/movers (default 5 landscape, 8 square)
  --title "..."             headline override
  --caption "..."           bottom-left caption override
  --out FILE                output PNG (default ./cards/<kind>-<size>-<YYYY-MM-DD>.png)
  stat only:
  --value "545"             the big number
  --label "distros tracked" line under it
  --detail "..."            optional smaller line

  Ranking cards show rank positions only, never page-hit counts.`;

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function getJson<T>(api: string, path: string): Promise<T> {
  const res = await fetch(`${api}${path}`);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} (API_URL=${api})`);
  return (await res.json()) as T;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    return;
  }
  const kind = arg(args, "kind") as Kind | undefined;
  if (!kind || !KINDS.includes(kind)) throw new Error(`--kind must be one of ${KINDS.join(", ")}`);
  const size = (arg(args, "size") ?? "landscape") as Size;
  if (!(size in SIZES)) throw new Error("--size must be landscape or square");
  const api = (process.env.API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const site = (process.env.SITE_URL ?? "https://linuxstatistics.com").replace(/\/$/, "");
  const count = arg(args, "count");
  const input: CardInput = { size, siteHost: new URL(site).host, title: arg(args, "title"), caption: arg(args, "caption"), count: count ? Number(count) : undefined };

  const meta = await getJson<Meta>(api, "/api/meta");
  const idx = meta.sources.find((s) => s.source === "wikipedia");
  const asOf = idx?.lastSuccessAt ?? new Date().toISOString();

  let tree;
  if (kind === "top") tree = topCard(await getJson<DistroListItem[]>(api, "/api/distros"), input, asOf);
  else if (kind === "movers") tree = moversCard(await getJson<DistroListItem[]>(api, "/api/rising"), input, asOf);
  else if (kind === "share") tree = shareCard(await getJson<MarketSharePoint[]>(api, "/api/market-share?region=global"), input);
  else {
    const value = arg(args, "value");
    const label = arg(args, "label");
    if (!value || !label) throw new Error("stat needs --value and --label");
    tree = statCard({ value, label, detail: arg(args, "detail") }, input);
  }

  const out = resolve(arg(args, "out") ?? `cards/${kind}-${size}-${asOf.slice(0, 10)}.png`);
  mkdirSync(resolve(out, ".."), { recursive: true });
  writeFileSync(out, await toPng(tree, size));
  console.log(`card: wrote ${out}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
