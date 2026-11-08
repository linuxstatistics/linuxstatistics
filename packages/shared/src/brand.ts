/** Brand colours and the site mark (black disc, light L-axis, three neon bars). */
export const BRAND = {
  neon: "#3cfe3f",
  paper: "#e9eef5",
  ink: "#000000",
  muted: "#7d8794",
  ring: "#2a2d33",
} as const;

/** The mark as a standalone SVG document (250×250). Same geometry as the site header. */
export function brandMarkSvg(opts: { ring?: boolean } = {}): string {
  const ring = opts.ring === false ? "" : ` stroke="${BRAND.ring}" stroke-width="2"`;
  const r = opts.ring === false ? 125 : 123;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250">` +
    `<circle cx="125" cy="125" r="${r}" fill="${BRAND.ink}"${ring}/>` +
    `<path d="M72 60V190H192" fill="none" stroke="${BRAND.paper}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="100" y="132" width="22" height="40" rx="4" fill="${BRAND.neon}"/>` +
    `<rect x="133" y="106" width="22" height="66" rx="4" fill="${BRAND.neon}"/>` +
    `<rect x="166" y="74" width="22" height="98" rx="4" fill="${BRAND.neon}"/>` +
    `</svg>`
  );
}

/** data: URI of the mark, for Satori `img` elements. */
export function brandMarkDataUri(opts?: { ring?: boolean }): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(brandMarkSvg(opts))}`;
}

/** Brand colours as listed in the press kit. */
export const BRAND_COLOURS: { name: string; hex: string; use: string }[] = [
  { name: "Neon", hex: BRAND.neon, use: "accent, bars, 'stats' in the wordmark" },
  { name: "Paper", hex: BRAND.paper, use: "light lettering on dark" },
  { name: "Ink", hex: BRAND.ink, use: "mark disc, dark lettering" },
  { name: "Muted", hex: BRAND.muted, use: "secondary text on dark" },
];

export const hexToRgb = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

/** Press boilerplate: from the site's own About copy. */
export const BOILERPLATE =
  "LinuxStatistics ranks Linux distributions and helps people pick one. Its composite index blends Wikipedia interest, DistroWatch page hits, GitHub activity and the site's own traffic; a short quiz, side-by-side comparisons and switching guides turn the numbers into a choice. Independent, open source under the AGPL-3.0, run by Chris Hartman in the United States.";
export const ONE_LINER = "Linux distro rankings and a picker that explains itself.";

/** Files in /press/, relative to that folder. One source for the page, the menu and the zip README. */
export const PRESS_FILES = {
  markSvg: "Logos/linuxstats-mark.svg",
  markPng: "Logos/linuxstats-mark-1200.png",
  tilePng: "Logos/linuxstats-mark-tile-1024.png",
  logoDarkSvg: "Logos/linuxstats-logo-dark.svg",
  logoDarkPng: "Logos/linuxstats-logo-dark-1200.png",
  logoLightSvg: "Logos/linuxstats-logo-light.svg",
  logoLightPng: "Logos/linuxstats-logo-light-1200.png",
  avatar250: "Logos/linuxstats-avatar-250.png",
  avatar1024: "Logos/linuxstats-avatar-1024.png",
  avatarWordmark250: "Logos/linuxstats-avatar-wordmark-250.png",
  avatarWordmark1024: "Logos/linuxstats-avatar-wordmark-1024.png",
  colours: "colours.txt",
  boilerplate: "boilerplate.txt",
  readme: "README.txt",
  zip: "PressKit.zip",
} as const;
