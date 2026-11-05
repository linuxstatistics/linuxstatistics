import type { APIRoute } from "astro";
import { loadMarketShare } from "../../lib/data";
import { marketShareRows } from "../../lib/dataset";
import { toCsv } from "../../lib/csv";

export const GET: APIRoute = async () => {
  const points = await loadMarketShare();
  return new Response(toCsv(["month", "region", "platform", "share_pct"], marketShareRows(points)), {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
};
