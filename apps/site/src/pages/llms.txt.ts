import type { APIRoute } from "astro";
import { loadDistros } from "../lib/data";
import { llmsIndex, TEXT_HEADERS } from "../lib/llms";

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL("https://linuxstatistics.com")).href.replace(/\/$/, "");
  const list = await loadDistros();
  return new Response(llmsIndex(base, list.length), { headers: TEXT_HEADERS });
};
