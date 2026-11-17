import type { APIRoute } from "astro";
import * as icons from "simple-icons";
import { DISTRO_MARKS, markId } from "../lib/distro-marks";

const bySlug = new Map(Object.values(icons).map((i) => [i.slug, i]));

/** One SVG sprite with every distro mark; pages reference it with <use href="/marks.svg#m-<slug>">. */
export const GET: APIRoute = () => {
  const symbols = Object.entries(DISTRO_MARKS).map(([slug, m]) => {
    const icon = bySlug.get(m.icon);
    if (!icon) throw new Error(`distro-marks: simple-icons has no "${m.icon}" (for ${slug})`);
    return `<symbol id="${markId(slug)}" viewBox="0 0 24 24"><path d="${icon.path}"/></symbol>`;
  });
  const body = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>`;
  return new Response(body, { headers: { "Content-Type": "image/svg+xml" } });
};
