import type { APIRoute } from "astro";
import { loadDistro, loadDistros, loadMeta, mapLimit } from "../lib/data";
import { ATOM_HEADERS, moversItem, releaseItems, renderAtom, sortItems } from "../lib/feed";

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://linuxstatistics.com");
  const [list, meta] = await Promise.all([loadDistros(), loadMeta()]);
  const details = await mapLimit(list, 8, (d) => loadDistro(d.slug));
  const index = meta.sources.find((s) => s.source === "wikipedia")?.lastSuccessAt;
  const items = sortItems([...details.flatMap((d) => releaseItems(d, base)), ...(index ? [moversItem(index, base)] : [])]).slice(0, 50);
  const body = renderAtom({
    title: "LinuxStatistics",
    subtitle: "New Linux distro releases and the monthly movers.",
    self: new URL("/feed.xml", base).href,
    home: base.href,
    items,
  });
  return new Response(body, { headers: ATOM_HEADERS });
};
