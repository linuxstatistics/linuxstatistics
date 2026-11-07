/**
 * Linux distributions on Wikidata (CC0): every item that is an instance of
 * (a subclass of) "Linux distribution", with its DistroWatch ID, base,
 * inception, website and dissolution date when present.
 */
export const WIKIDATA_SPARQL = `SELECT ?item ?itemLabel ?dw ?base ?inception ?website ?dissolved WHERE {
  ?item wdt:P31/wdt:P279* wd:Q131669 .
  OPTIONAL { ?item wdt:P3112 ?dw . }
  OPTIONAL { ?item wdt:P144 ?base . }
  OPTIONAL { ?item wdt:P571 ?inception . }
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item wdt:P576 ?dissolved . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

export const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

export interface WikidataDistro {
  /** Wikidata item ID, e.g. "Q3365". */
  qid: string;
  name: string;
  /** DistroWatch IDs (P3112), lowercased and sorted; old IDs can stay listed after a rename. */
  distrowatchKeys: string[];
  /** Wikidata item IDs this distro is based on (P144), sorted. */
  baseQids: string[];
  firstReleaseYear: number | null;
  homepage: string | null;
  dissolved: boolean;
}

interface Binding {
  [k: string]: { value: string } | undefined;
}

const QID = /^https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/;

function qidOf(uri: string | undefined): string | null {
  const m = uri ? QID.exec(uri) : null;
  return m ? m[1]! : null;
}

/**
 * Parse a SPARQL JSON result into one record per item. Items can appear on
 * several rows (several bases or websites); values are merged
 * deterministically: earliest inception year, shortest https website, all
 * bases. Items without an English label (the label service then returns the
 * QID) are skipped. Fails loudly on a malformed or suspiciously small result
 * so a partial response never reaches the database.
 */
export function parseWikidataDistros(json: unknown, opts: { minItems?: number } = {}): WikidataDistro[] {
  const minItems = opts.minItems ?? 200;
  const bindings = (json as { results?: { bindings?: Binding[] } })?.results?.bindings;
  if (!Array.isArray(bindings)) throw new Error("Wikidata response has no results.bindings");

  type Acc = { name: string; dw: Set<string>; bases: Set<string>; years: number[]; sites: Set<string>; dissolved: boolean };
  const byQid = new Map<string, Acc>();
  for (const b of bindings) {
    const qid = qidOf(b.item?.value);
    const name = b.itemLabel?.value?.trim();
    if (!qid) throw new Error(`Wikidata row without a valid item: ${JSON.stringify(b).slice(0, 120)}`);
    if (!name || /^Q\d+$/.test(name)) continue;
    const acc = byQid.get(qid) ?? { name, dw: new Set(), bases: new Set(), years: [], sites: new Set(), dissolved: false };
    const dw = b.dw?.value?.trim().toLowerCase();
    if (dw && /^[a-z0-9][a-z0-9_-]*$/.test(dw)) acc.dw.add(dw);
    const base = qidOf(b.base?.value);
    if (base && base !== qid) acc.bases.add(base);
    const year = b.inception?.value ? Number.parseInt(b.inception.value.slice(0, 4), 10) : NaN;
    if (Number.isInteger(year) && year >= 1990 && year <= 2100) acc.years.push(year);
    const site = b.website?.value?.trim();
    if (site && /^https?:\/\//.test(site)) acc.sites.add(site);
    if (b.dissolved?.value) acc.dissolved = true;
    byQid.set(qid, acc);
  }

  if (byQid.size < minItems) {
    throw new Error(`Wikidata returned only ${byQid.size} distributions (expected at least ${minItems}); not using it`);
  }

  const pickSite = (sites: Set<string>) =>
    [...sites].sort((a, b) => Number(b.startsWith("https://")) - Number(a.startsWith("https://")) || a.length - b.length || a.localeCompare(b))[0] ?? null;

  return [...byQid]
    .map(([qid, a]) => ({
      qid,
      name: a.name,
      distrowatchKeys: [...a.dw].sort(),
      baseQids: [...a.bases].sort(),
      firstReleaseYear: a.years.length ? Math.min(...a.years) : null,
      homepage: pickSite(a.sites),
      dissolved: a.dissolved,
    }))
    .sort((x, y) => Number(x.qid.slice(1)) - Number(y.qid.slice(1)));
}

/** URL-safe slug from a display name ("Pop!_OS" -> "pop-os"). */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
