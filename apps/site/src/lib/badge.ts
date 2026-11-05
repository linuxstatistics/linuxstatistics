/**
 * Rank badges, shields.io-style: a grey label and a coloured value.
 * Widths use a fixed per-character estimate so no font is needed at build.
 */
export type BadgeTheme = "dark" | "light";

const CHAR = 6.6; // average Verdana 11px glyph width
const PAD = 10;

function width(text: string): number {
  return Math.round(text.length * CHAR + PAD * 2);
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Value text for a rank: "#3", or "not ranked". */
export function rankText(rank: number | null): string {
  return rank == null ? "not ranked" : `#${rank}`;
}

export function badgeSvg(opts: { label?: string; value: string; theme?: BadgeTheme; title?: string }): string {
  const label = opts.label ?? "LinuxStatistics";
  const value = opts.value;
  const lw = width(label);
  const vw = width(value);
  const w = lw + vw;
  const dark = (opts.theme ?? "dark") === "dark";
  const labelBg = dark ? "#2b2f38" : "#e6e8ec";
  const labelFg = dark ? "#f2f3f5" : "#1f232b";
  const valueBg = value === "not ranked" ? "#8a97a6" : "#e8a33c";
  const valueFg = "#1c1408";
  const title = esc(opts.title ?? `${label}: ${value}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${title}"><title>${title}</title><rect width="${lw}" height="20" rx="3" fill="${labelBg}"/><rect x="${lw}" width="${vw}" height="20" rx="3" fill="${valueBg}"/><rect x="${lw}" width="4" height="20" fill="${valueBg}"/><g font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle"><text x="${lw / 2}" y="14" fill="${labelFg}">${esc(label)}</text><text x="${lw + vw / 2}" y="14" fill="${valueFg}" font-weight="bold">${esc(value)}</text></g></svg>`;
}

/** Markdown and HTML snippets for a distro's badge. */
export function badgeSnippets(site: string, slug: string, name: string) {
  const img = `${site}/badge/${slug}.svg`;
  const page = `${site}/distro/${slug}/`;
  const alt = `${name} on LinuxStatistics`;
  return {
    markdown: `[![${alt}](${img})](${page})`,
    html: `<a href="${page}"><img src="${img}" alt="${alt}"></a>`,
  };
}
