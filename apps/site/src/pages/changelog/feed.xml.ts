import type { APIRoute } from "astro";
import { loadSourceEvents } from "../../lib/data";
import { ATOM_HEADERS, renderAtom } from "../../lib/feed";
import { changeFeedItems, changeRows } from "../../lib/changelog";

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://linuxstatistics.com");
  const items = changeFeedItems(changeRows(await loadSourceEvents()), base);
  const body = renderAtom({
    title: "LinuxStatistics changelog",
    subtitle: "Changes to how we rank distros, data corrections and data-source outages.",
    self: new URL("/changelog/feed.xml", base).href,
    home: new URL("/changelog/", base).href,
    items,
  });
  return new Response(body, { headers: ATOM_HEADERS });
};
