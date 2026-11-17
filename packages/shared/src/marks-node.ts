import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import * as icons from "simple-icons";
import { DISTRO_IMAGES, DISTRO_MARKS, markStyle } from "./distro-marks.js";

/** Folder with the full-colour icon PNGs; the site copies it to /marks/ at build time. */
export const MARKS_DIR = join(dirname(createRequire(import.meta.url).resolve("@linux-statistics/shared/package.json")), "marks") + "/";

const bySlug = new Map(Object.values(icons).map((i) => [i.slug, i]));

/** simple-icons path data for a manifest entry; throws if the pinned package lacks it. */
export function markPath(slug: string): string | null {
  const m = DISTRO_MARKS[slug];
  if (!m) return null;
  const icon = bySlug.get(m.icon);
  if (!icon) throw new Error(`distro-marks: simple-icons has no "${m.icon}" (for ${slug})`);
  return icon.path;
}

/**
 * A distro's logo as a data: URI (for Satori share cards), or null when we only
 * have a monogram. Tile marks come back as a square SVG; full-colour icons as PNG.
 */
export function markDataUri(slug: string): string | null {
  const s = markStyle(slug);
  const path = markPath(slug);
  if (s && path) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">` +
      `<rect width="24" height="24" fill="${s.bg}"/>` +
      `<g transform="translate(4.32 4.32) scale(0.64)"><path d="${path}" fill="${s.fg}"/></g></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  const img = DISTRO_IMAGES[slug];
  if (img) return `data:image/png;base64,${readFileSync(MARKS_DIR + img.file).toString("base64")}`;
  return null;
}
