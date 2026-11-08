import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { BOILERPLATE, BRAND, BRAND_COLOURS, ONE_LINER, PRESS_FILES, brandMarkSvg, brandMarkDataUri, hexToRgb } from "@linux-statistics/shared";

/**
 * Renders the press-kit assets from the brand module into apps/site/public/press/
 * and zips them deterministically. Run after any brand change:
 *   pnpm --filter @linux-statistics/worker press-kit
 */
const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../../../site/public/press");
const FIXED_TIME = new Date("2026-11-08T00:00:00Z");
const inter800 = readFileSync(require.resolve("@fontsource/inter/files/inter-latin-800-normal.woff"));

type El = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown): El => ({ type, props: { style: { display: "flex", ...style }, children } });

/** Wordmark lockup: mark + "linuxstats". Dark = for dark backgrounds (paper text); light = for light (ink text, neon highlight). */
async function logoSvg(variant: "dark" | "light"): Promise<string> {
  const text = variant === "dark" ? BRAND.paper : BRAND.ink;
  // Light: the site's light-mode brand puts a neon highlighter behind "stats".
  const stats = variant === "dark" ? h("span", { color: BRAND.neon }, "stats") : h("span", { color: "#0b2a0d", background: BRAND.neon, padding: "0 14px 0 8px", borderRadius: 12, marginLeft: 8, lineHeight: 0.98 }, "stats");
  const tree = h("div", { width: 1200, height: 300, alignItems: "center", gap: 36, fontFamily: "Inter", fontWeight: 800, letterSpacing: -6, fontSize: 196, lineHeight: 1 }, [
    h("div", { width: 236, height: 236, flexShrink: 0 }, [{ type: "img", props: { src: brandMarkDataUri({ ring: false }), width: 236, height: 236 } }]),
    h("div", { color: text, alignItems: "baseline", flexShrink: 0 }, [h("span", {}, "linux"), stats]),
  ]);
  return satori(tree as unknown as Parameters<typeof satori>[0], { width: 1200, height: 300, fonts: [{ name: "Inter", data: inter800, weight: 800, style: "normal" }] });
}

/** Stacked wordmark avatar: "linux / stats" on a black disc. */
async function stackedAvatarSvg(): Promise<string> {
  const tree = h("div", { width: 250, height: 250, background: BRAND.ink, borderRadius: 125, border: `2px solid ${BRAND.ring}`, boxSizing: "border-box", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter", fontWeight: 800, letterSpacing: -2.5, lineHeight: 0.92 }, [
    h("div", { fontSize: 58, color: BRAND.paper }, "linux"),
    h("div", { fontSize: 58, color: BRAND.neon }, "stats"),
  ]);
  return satori(tree as unknown as Parameters<typeof satori>[0], { width: 250, height: 250, fonts: [{ name: "Inter", data: inter800, weight: 800, style: "normal" }] });
}

const png = (svg: string, width: number) => new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();

/** Mark on a filled square tile (app icon style). */
function tileSvg(size: number): string {
  const inner = brandMarkSvg({ ring: false }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="${size}" height="${size}"><rect width="250" height="250" rx="56" fill="${BRAND.ink}"/>${inner.replace(/<circle[^>]*\/>/, "")}</svg>`;
}

export async function buildPressKit(out = OUT): Promise<string[]> {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(resolve(out, "Logos"), { recursive: true });
  const files: string[] = [];
  const write = (rel: string, data: string | Buffer) => {
    const p = resolve(out, rel);
    writeFileSync(p, data);
    utimesSync(p, FIXED_TIME, FIXED_TIME);
    files.push(rel);
  };

  const mark = brandMarkSvg({ ring: false });
  write(PRESS_FILES.markSvg, mark);
  write(PRESS_FILES.markPng, png(mark, 1200));
  write(PRESS_FILES.tilePng, png(tileSvg(1024), 1024));
  for (const v of ["dark", "light"] as const) {
    const svg = await logoSvg(v);
    write(v === "dark" ? PRESS_FILES.logoDarkSvg : PRESS_FILES.logoLightSvg, svg);
    write(v === "dark" ? PRESS_FILES.logoDarkPng : PRESS_FILES.logoLightPng, png(svg, 1200));
  }
  const avatar = brandMarkSvg();
  write(PRESS_FILES.avatar250, png(avatar, 250));
  write(PRESS_FILES.avatar1024, png(avatar, 1024));
  const stacked = await stackedAvatarSvg();
  write(PRESS_FILES.avatarWordmark250, png(stacked, 250));
  write(PRESS_FILES.avatarWordmark1024, png(stacked, 1024));

  write(PRESS_FILES.colours, BRAND_COLOURS.map((c) => `${c.name.padEnd(6)} ${c.hex}  rgb(${hexToRgb(c.hex)})  ${c.use}`).join("\n") + "\n\nFonts: Archivo (display), IBM Plex Sans (text), both SIL Open Font License, self-hosted. Wordmark in the logo files is outlined (Inter 800); no font files are included.\n");
  write(PRESS_FILES.boilerplate, `${BOILERPLATE}\n\nOne line: ${ONE_LINER}\n\nName: LinuxStatistics (one word; "linuxstats" in the wordmark). Site: https://linuxstatistics.com. Press contact: hello@linuxstatistics.com.\n`);
  write(
    PRESS_FILES.readme,
    [
      "LinuxStatistics press kit",
      "",
      "Logos/linuxstats-mark.svg, -1200.png      The mark: black disc, light axis, three neon bars. Transparent outside the disc.",
      "Logos/linuxstats-mark-tile-1024.png       The mark on a rounded black square (app icon, square avatars).",
      "Logos/linuxstats-logo-dark.svg, -1200.png Mark + wordmark for dark backgrounds (light lettering).",
      "Logos/linuxstats-logo-light.svg, -1200.png Mark + wordmark for light backgrounds (dark lettering, neon highlight).",
      "Logos/linuxstats-avatar-250.png, -1024.png Round avatar with a faint ring, for social profiles.",
      "Logos/linuxstats-avatar-wordmark-*.png     Alternative round avatar with the stacked wordmark.",
      "colours.txt                               Brand colours (hex, rgb) and fonts.",
      "boilerplate.txt                           Company description, one-liner, name, contact.",
      "",
      "Please don't recolour, outline, stretch, rotate or add effects to the marks. Keep clear space of at least the bar width around them.",
      "Everything here may be used to refer to LinuxStatistics in articles, listings, talks and videos.",
      "",
      "Latest version: https://linuxstatistics.com/press/",
    ].join("\n") + "\n",
  );

  // Deterministic zip: fixed mtimes above, no extra attributes, sorted names.
  const zipPath = resolve(out, PRESS_FILES.zip);
  execFileSync("zip", ["-X", "-q", "-r", zipPath, ...files.sort()], { cwd: out });
  utimesSync(zipPath, FIXED_TIME, FIXED_TIME);
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPressKit().then((f) => console.log(`press-kit: wrote ${f.length} files + PressKit.zip to ${OUT}`));
}
