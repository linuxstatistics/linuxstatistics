/**
 * endoflife.date product API (data under CC BY-SA 4.0; credit on the site).
 * Docs: https://endoflife.date/docs/api/
 */
export const ENDOFLIFE_BASE = "https://endoflife.date/api";

/** Our slug -> endoflife.date product. Only products that are whole distros. */
export const ENDOFLIFE_PRODUCTS: Record<string, string> = {
  alma: "almalinux",
  alpine: "alpine-linux",
  centos: "centos",
  debian: "debian",
  fedora: "fedora",
  freebsd: "freebsd",
  mint: "linuxmint",
  mageia: "mageia",
  mx: "mxlinux",
  nixos: "nixos",
  openbsd: "openbsd",
  opensuse: "opensuse",
  popos: "pop-os",
  raspios: "raspberry-pi",
  redhat: "rhel",
  rocky: "rocky-linux",
  slackware: "slackware",
  steamos: "steamos",
  tails: "tails",
  ubuntu: "ubuntu",
};

export const productUrl = (product: string) => `${ENDOFLIFE_BASE}/${product}.json`;

export interface ReleaseCycleRow {
  cycle: string;
  codename: string | null;
  releasedOn: string | null;
  latest: string | null;
  latestOn: string | null;
  supportEnds: string | null;
  eol: string | null;
  lts: boolean;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** endoflife.date uses a date, `true` (already ended, date unknown) or `false` (not planned). */
const dateOrNull = (v: unknown): string | null => (typeof v === "string" && DATE.test(v) ? v : null);

/** Parse one product response into cycles, newest first. Throws on an unexpected shape. */
export function parseEndoflife(json: unknown): ReleaseCycleRow[] {
  if (!Array.isArray(json)) throw new Error("endoflife.date response is not an array");
  const rows: ReleaseCycleRow[] = [];
  for (const it of json as Record<string, unknown>[]) {
    const cycle = it.cycle;
    if (typeof cycle !== "string" && typeof cycle !== "number") throw new Error(`Malformed cycle: ${JSON.stringify(it).slice(0, 80)}`);
    rows.push({
      cycle: String(cycle),
      codename: typeof it.codename === "string" && it.codename ? it.codename : null,
      releasedOn: dateOrNull(it.releaseDate),
      latest: typeof it.latest === "string" && it.latest ? it.latest : null,
      latestOn: dateOrNull(it.latestReleaseDate),
      // `support` = standard support; when a product lacks it, `eol` is the only end date.
      supportEnds: dateOrNull(it.support) ?? dateOrNull(it.eol),
      eol: dateOrNull(it.extendedSupport) ?? dateOrNull(it.eol),
      lts: it.lts === true || (typeof it.lts === "string" && DATE.test(it.lts)),
    });
  }
  rows.sort((a, b) => (b.releasedOn ?? "").localeCompare(a.releasedOn ?? ""));
  return rows;
}
