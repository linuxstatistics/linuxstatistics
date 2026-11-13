import type { APIRoute, GetStaticPaths } from "astro";
import { buildSummary, cardPath, renderCard, summaryDate } from "@linux-statistics/worker/monthly";
import { loadDistros, loadMarketShare, loadMeta, loadRising } from "../../lib/data";

// The monthly email links to this card. Built from the same data and rules as
// `worker monthly`, so the email and the site always show the same picture.
async function summary() {
  const [list, rising, share, meta] = await Promise.all([loadDistros(), loadRising(), loadMarketShare(), loadMeta()]);
  return buildSummary(list, rising, share, summaryDate(meta));
}

export const getStaticPaths: GetStaticPaths = async () => {
  const s = await summary();
  return [{ params: { month: cardPath(s).replace(/^\/monthly\/|\.png$/g, "") } }];
};

export const GET: APIRoute = async ({ site }) => {
  const png = await renderCard(await summary(), site?.host ?? "linuxstatistics.com");
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
