import type { DesktopId, PackageManager } from "@linux-statistics/shared";

/**
 * Desktops (P1414 "GUI toolkit or framework") and package managers (P3033) of
 * Linux distributions on Wikidata (CC0). A separate query from the main one so
 * these multi-valued claims don't multiply its rows. Values are mapped through
 * fixed tables below; anything unknown (toolkits like GTK or Qt, shells,
 * versions we don't track) is dropped.
 */
export const WIKIDATA_FACTS_SPARQL = `SELECT ?item ?gui ?pkg WHERE {
  ?item wdt:P31/wdt:P279* wd:Q131669 .
  { ?item wdt:P1414 ?gui . } UNION { ?item wdt:P3033 ?pkg . }
}`;

/** Wikidata item -> our desktop ID. Checked by hand 2026-11-18. */
export const WIKIDATA_DESKTOPS: Record<string, DesktopId> = {
  Q44316: "gnome",
  Q1431: "kde-plasma", // KDE
  Q107664269: "kde-plasma",
  Q17363870: "kde-plasma", // KDE Plasma 5
  Q115839146: "kde-plasma", // KDE Plasma 6
  Q170821: "xfce",
  Q194090: "mate",
  Q1092551: "cinnamon",
  Q47123: "lxde",
  Q18341825: "lxqt",
  Q692045: "enlightenment",
  Q57742981: "dde",
  Q27888813: "budgie",
  Q381140: "unity",
  Q25550863: "unity",
  Q56342589: "pantheon",
  Q14301825: "trinity",
  Q138656656: "cosmic",
  Q117472575: "hyprland",
  Q28975508: "sway",
  Q1652973: "i3",
  Q135975643: "niri",
  Q136038819: "labwc",
  Q728978: "openbox",
  Q669886: "icewm",
  Q679212: "jwm",
  Q131522: "fluxbox",
  Q28457338: "herbstluftwm",
};

/**
 * Wikidata item -> the command-line tool people use. Low-level formats that
 * don't say which front end a distro uses (dpkg, RPM) are left out: they would
 * put the wrong name on the page.
 */
export const WIKIDATA_PACKAGE_MANAGERS: Record<string, PackageManager> = {
  Q230724: "apt",
  Q18851353: "dnf",
  Q1823191: "zypper",
  Q69952: "pacman",
  Q21088094: "xbps",
  Q51821718: "apk",
  Q596391: "apk",
  Q7041957: "nix",
  Q18968627: "guix",
  Q908542: "portage",
  Q625662: "yum",
};

export interface WikidataFacts {
  qid: string;
  /** Our desktop IDs, sorted, no duplicates. */
  desktops: DesktopId[];
  /** One package manager when Wikidata names exactly one we map; otherwise null. */
  packageManager: PackageManager | null;
}

interface Binding {
  [k: string]: { value: string } | undefined;
}

const QID = /^https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/;
const qidOf = (uri: string | undefined) => {
  const m = uri ? QID.exec(uri) : null;
  return m ? m[1]! : null;
};

/**
 * Parse the SPARQL JSON into one record per item that has at least one value
 * we map. Fails loudly on a malformed or suspiciously small result so a
 * partial response never reaches the database.
 */
export function parseWikidataFacts(json: unknown, opts: { minItems?: number } = {}): WikidataFacts[] {
  const minItems = opts.minItems ?? 50;
  const bindings = (json as { results?: { bindings?: Binding[] } })?.results?.bindings;
  if (!Array.isArray(bindings)) throw new Error("Wikidata facts response has no results.bindings");
  const acc = new Map<string, { desktops: Set<DesktopId>; pkgs: Set<PackageManager> }>();
  for (const b of bindings) {
    const qid = qidOf(b.item?.value);
    if (!qid) throw new Error(`Wikidata facts row without a valid item: ${JSON.stringify(b).slice(0, 120)}`);
    const a = acc.get(qid) ?? { desktops: new Set(), pkgs: new Set() };
    const d = WIKIDATA_DESKTOPS[qidOf(b.gui?.value) ?? ""];
    if (d) a.desktops.add(d);
    const p = WIKIDATA_PACKAGE_MANAGERS[qidOf(b.pkg?.value) ?? ""];
    if (p) a.pkgs.add(p);
    acc.set(qid, a);
  }
  if (acc.size < minItems) throw new Error(`Wikidata returned facts for only ${acc.size} distributions (expected at least ${minItems}); not using it`);
  return [...acc]
    .map(([qid, a]) => ({ qid, desktops: [...a.desktops].sort(), packageManager: a.pkgs.size === 1 ? [...a.pkgs][0]! : null }))
    .filter((x) => x.desktops.length || x.packageManager)
    .sort((x, y) => Number(x.qid.slice(1)) - Number(y.qid.slice(1)));
}
