import type { APIRoute } from "astro";
import { loadDistro, loadDistros, mapLimit } from "../../lib/data";
import { toCsv } from "../../lib/csv";

/** Every stored 12-month rank snapshot, one row per distro per capture. */
export const GET: APIRoute = async () => {
  const list = await loadDistros();
  const details = await mapLimit(list, 8, (d) => loadDistro(d.slug));
  const rows = details.flatMap((d) => d.rankHistory.map((p) => [d.slug, p.capturedAt.slice(0, 10), p.value]));
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])));
  return new Response(toCsv(["slug", "captured_on", "rank_12m"], rows), { headers: { "Content-Type": "text/csv; charset=utf-8" } });
};
