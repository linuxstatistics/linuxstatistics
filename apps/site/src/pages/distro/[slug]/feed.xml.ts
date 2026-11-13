import type { APIRoute, GetStaticPaths } from "astro";
import type { DistroDetail } from "@linux-statistics/shared";
import { loadDistro, loadDistros, mapLimit } from "../../../lib/data";
import { ATOM_HEADERS, releaseItems, renderAtom } from "../../../lib/feed";

// Only distros with release data get a feed; the others would always be empty.
export const getStaticPaths: GetStaticPaths = async () => {
  const list = await loadDistros();
  const details = await mapLimit(list, 8, (d) => loadDistro(d.slug));
  return details.filter((d) => d.releases.length > 0).map((data) => ({ params: { slug: data.slug }, props: { data } }));
};

export const GET: APIRoute = async ({ props, site }) => {
  const base = site ?? new URL("https://linuxstatistics.com");
  const data = props.data as DistroDetail;
  const body = renderAtom({
    title: `${data.name} releases | LinuxStatistics`,
    subtitle: `New ${data.name} releases and updates.`,
    self: new URL(`/distro/${data.slug}/feed.xml`, base).href,
    home: new URL(`/distro/${data.slug}/`, base).href,
    items: releaseItems(data, base, new Date(), 3650).slice(0, 30),
  });
  return new Response(body, { headers: ATOM_HEADERS });
};
