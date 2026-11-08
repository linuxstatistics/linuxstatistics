import type { APIRoute } from "astro";
import { loadDistros, loadMarketShare } from "../lib/data";
import { latestLinuxShare } from "../lib/marketShare";
import { renderOgCard } from "../lib/og-card";

export const GET: APIRoute = async ({ site }) => {
  const [distros, marketShare] = await Promise.all([loadDistros(), loadMarketShare()]);
  const share = latestLinuxShare(marketShare);
  const png = await renderOgCard({ tracked: distros.length, sharePct: share?.value ?? null, siteHost: site?.host ?? "linuxstatistics.com" });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
