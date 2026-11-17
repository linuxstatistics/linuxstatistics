import type { APIRoute } from "astro";
import { loadDistro, loadDistros, mapLimit } from "../lib/data";
import { llmsFull, TEXT_HEADERS } from "../lib/llms";

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL("https://linuxstatistics.com")).href.replace(/\/$/, "");
  const list = await loadDistros();
  const details = await mapLimit(list, 8, (d) => loadDistro(d.slug));
  const generatedAt = new Date().toISOString().slice(0, 10);
  return new Response(llmsFull(base, generatedAt, details), { headers: TEXT_HEADERS });
};
