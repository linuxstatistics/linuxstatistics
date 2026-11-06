import type { APIRoute, GetStaticPaths } from "astro";
import { loadDistros } from "../../../lib/data";
import { PROFILES } from "../../../lib/picker-profiles";
import { renderMatchCard } from "../../../lib/match-card";

export const getStaticPaths: GetStaticPaths = async () => {
  const bySlug = new Map((await loadDistros()).map((d) => [d.slug, d]));
  return PROFILES.filter((p) => bySlug.has(p.key)).map((p) => ({
    params: { slug: p.key },
    props: { name: bySlug.get(p.key)!.name, rank: bySlug.get(p.key)!.rank, blurb: p.blurb },
  }));
};

export const GET: APIRoute = async ({ props, site }) => {
  const png = await renderMatchCard(props as { name: string; rank: number | null; blurb: string }, site?.host ?? "linuxstatistics.com");
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
