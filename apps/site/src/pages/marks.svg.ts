import type { APIRoute } from "astro";
import { DISTRO_MARKS, markId } from "../lib/distro-marks";
import { markPath } from "@linux-statistics/shared/marks-node";

/** One SVG sprite with every distro mark; pages reference it with <use href="/marks.svg#m-<slug>">. */
export const GET: APIRoute = () => {
  const symbols = Object.keys(DISTRO_MARKS).map((slug) => `<symbol id="${markId(slug)}" viewBox="0 0 24 24"><path d="${markPath(slug)}"/></symbol>`);
  const body = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>`;
  return new Response(body, { headers: { "Content-Type": "image/svg+xml" } });
};
