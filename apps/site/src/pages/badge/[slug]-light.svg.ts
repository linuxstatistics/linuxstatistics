import type { APIRoute, GetStaticPaths } from "astro";
import { loadDistros } from "../../lib/data";
import { badgeSvg, rankText } from "../../lib/badge";

export const getStaticPaths: GetStaticPaths = async () => {
  const list = await loadDistros();
  return list.map((d) => ({ params: { slug: d.slug }, props: { name: d.name, rank: d.rank } }));
};

export const GET: APIRoute = ({ props }) => {
  const { name, rank } = props as { name: string; rank: number | null };
  const svg = badgeSvg({ value: rankText(rank), theme: "light", title: `${name}: ${rankText(rank)} on LinuxStatistics` });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
};
