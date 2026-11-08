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
