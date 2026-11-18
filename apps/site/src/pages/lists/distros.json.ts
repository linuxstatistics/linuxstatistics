import type { APIRoute } from "astro";
import { loadDistros } from "../../lib/data";
import { packList } from "../../lib/distro-list";

// Site-internal: the islands load it instead of carrying the list in every page's HTML.
export const GET: APIRoute = async () => {
  const list = await loadDistros();
  return new Response(JSON.stringify(packList(list)), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
