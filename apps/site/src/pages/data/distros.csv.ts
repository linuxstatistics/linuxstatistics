import type { APIRoute } from "astro";
import { loadDistros } from "../../lib/data";
import { DISTRO_COLUMNS, byName, distroRow } from "../../lib/dataset";
import { toCsv } from "../../lib/csv";

export const GET: APIRoute = async () => {
  const list = await loadDistros();
  return new Response(toCsv([...DISTRO_COLUMNS], byName(list).map(distroRow)), { headers: { "Content-Type": "text/csv; charset=utf-8" } });
};
