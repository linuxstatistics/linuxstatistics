import type { APIRoute } from "astro";
import { loadDistros } from "../../lib/data";
import { byName, distroRecord, envelope } from "../../lib/dataset";

export const GET: APIRoute = async () => {
  const list = await loadDistros();
  const generatedAt = new Date().toISOString().slice(0, 10);
  const body = envelope(generatedAt, byName(list).map(distroRecord), ["github"]);
  return new Response(JSON.stringify(body, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
