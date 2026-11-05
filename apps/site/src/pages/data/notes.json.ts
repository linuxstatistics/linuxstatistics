import type { APIRoute } from "astro";
import { loadMeta, dataDate } from "../../lib/data";
import { envelope, notesDataset } from "../../lib/dataset";

export const GET: APIRoute = async () => {
  const meta = await loadMeta();
  const generatedAt = dataDate(meta, "distrowatch") ?? new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(envelope(generatedAt, notesDataset()), null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
