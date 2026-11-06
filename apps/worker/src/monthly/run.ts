import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DistroListItem, MarketSharePoint, Meta } from "@linux-statistics/shared";
import { buildSummary, summaryEmailHtml, summaryMarkdown } from "./summary.js";
import { renderCard } from "./card.js";
import { createBroadcastDraft } from "./resend.js";

const USAGE = `Usage: monthly [--out DIR] [--draft]
  Reads from the API (API_URL, default http://localhost:3001) and writes
  summary.json, summary.md, email.html and card.png to DIR
  (default ./monthly/<YYYY-MM>). --draft also creates a Resend Broadcast
  draft (needs RESEND_API_KEY, RESEND_SEGMENT_ID, MONTHLY_FROM). Nothing is sent.`;

async function getJson<T>(api: string, path: string): Promise<T> {
  const res = await fetch(`${api}${path}`);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} (API_URL=${api})`);
  return (await res.json()) as T;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    return;
  }
  const outIdx = args.indexOf("--out");
  const draft = args.includes("--draft");
  const api = (process.env.API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const site = (process.env.SITE_URL ?? "https://linuxstatistics.com").replace(/\/$/, "");

  const [list, rising, share, meta] = await Promise.all([
    getJson<DistroListItem[]>(api, "/api/distros"),
    getJson<DistroListItem[]>(api, "/api/rising"),
    getJson<MarketSharePoint[]>(api, "/api/market-share?region=global"),
    getJson<Meta>(api, "/api/meta"),
  ]);
  const dw = meta.sources.find((s) => s.source === "distrowatch");
  const capturedAt = dw?.lastSuccessAt ? new Date(dw.lastSuccessAt) : new Date();
  const summary = buildSummary(list, rising, share, capturedAt);

  const out = resolve(outIdx >= 0 ? args[outIdx + 1]! : `monthly/${summary.capturedAt.slice(0, 7)}`);
  mkdirSync(out, { recursive: true });
  const md = summaryMarkdown(summary, site);
  const cardUrl = `${site}/monthly/${summary.capturedAt.slice(0, 7)}.png`;
  const html = summaryEmailHtml(summary, site, cardUrl);
  writeFileSync(resolve(out, "summary.json"), JSON.stringify(summary, null, 2));
  writeFileSync(resolve(out, "summary.md"), md);
  writeFileSync(resolve(out, "email.html"), html);
  writeFileSync(resolve(out, "card.png"), await renderCard(summary, new URL(site).host));
  console.log(`monthly: wrote summary.json, summary.md, email.html, card.png to ${out}`);
  console.log(`monthly: upload card.png to ${cardUrl} before sending the email`);

  if (draft) {
    const key = process.env.RESEND_API_KEY;
    const segmentId = process.env.RESEND_SEGMENT_ID;
    const from = process.env.MONTHLY_FROM;
    if (!key || !segmentId || !from) throw new Error("--draft needs RESEND_API_KEY, RESEND_SEGMENT_ID and MONTHLY_FROM");
    const id = await createBroadcastDraft(
      {
        segmentId,
        from,
        subject: `Linux distro rankings — ${summary.month}`,
        html,
        text: md,
        name: `Monthly rankings ${summary.capturedAt.slice(0, 7)}`,
      },
      key,
    );
    console.log(`monthly: Resend draft ${id} created. Review and send it from the Resend dashboard.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
