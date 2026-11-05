import type { APIRoute } from "astro";
import { loadDistros, loadMeta, dataDate } from "../../lib/data";
import { byRank, distroRecord, envelope } from "../../lib/dataset";

export const GET: APIRoute = async () => {
  const [list, meta] = await Promise.all([loadDistros(), loadMeta()]);
  const generatedAt = dataDate(meta, "distrowatch") ?? new Date().toISOString().slice(0, 10);
  const body = envelope(generatedAt, byRank(list).map(distroRecord), ["distrowatch", "github"]);
  return new Response(JSON.stringify(body, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
