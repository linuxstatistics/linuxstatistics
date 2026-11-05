import type { APIRoute } from "astro";
import { loadDistros } from "../../lib/data";
import { DISTRO_COLUMNS, byRank, distroRow } from "../../lib/dataset";
import { toCsv } from "../../lib/csv";

export const GET: APIRoute = async () => {
  const list = await loadDistros();
  return new Response(toCsv([...DISTRO_COLUMNS], byRank(list).map(distroRow)), { headers: { "Content-Type": "text/csv; charset=utf-8" } });
};
