import type { APIRoute } from "astro";
import { envelope, notesDataset } from "../../lib/dataset";

export const GET: APIRoute = async () => {
  const generatedAt = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(envelope(generatedAt, notesDataset()), null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
