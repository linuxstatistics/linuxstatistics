import { readFileSync } from "node:fs";
import type { APIRoute, GetStaticPaths } from "astro";
import { DISTRO_IMAGES } from "../../lib/distro-marks";
import { MARKS_DIR } from "@linux-statistics/shared/marks-node";

/** Full-colour icons, served from the one copy in packages/shared/marks. */
export const getStaticPaths: GetStaticPaths = () => Object.values(DISTRO_IMAGES).map((m) => ({ params: { file: m.file } }));

export const GET: APIRoute = ({ params }) =>
  new Response(new Uint8Array(readFileSync(MARKS_DIR + params.file)), { headers: { "Content-Type": "image/png" } });
