import {
  addAlias,
  aliasesFor,
  fillDistroBlanks,
  findDistroIdByAlias,
  findDistroIdBySlug,
  findDistroSlugById,
  getDistroRow,
  insertDiscoveredDistro,
  type Database,
  type DistroRow,
} from "@linux-statistics/db";
import { CHECKED_AGAINST_WIKIDATA, CURATED, WIKIDATA_PINS } from "./families.js";
import { slugify, type WikidataDistro } from "./sources/wikidata.js";

export interface WikidataIngestResult {
  /** Distros matched to a Wikidata item (alias written). */
  matched: number;
  /** Empty fields filled, as "slug.field". */
  filled: string[];
  /** New distros created, unlisted until they have a signal. */
  discovered: string[];
  /** Kept values that Wikidata disagrees with, as "slug.field: ours vs theirs". */
  conflicts: string[];
  /** Candidate matches dropped because nothing else agreed, as "slug <- Name (Qid): reason". */
  rejected: string[];
}

type Via = "alias" | "distrowatch" | "slug";

/**
 * Apply Wikidata facts.
 *
 * Matching, per item: an existing `wikidata` alias (validated on an earlier
 * run), then the item's DistroWatch IDs through our `distrowatch` aliases,
 * then our slug (only for distros with no external ID yet). One distro maps
 * to at most one item, firm matches first.
 *
 * A new DistroWatch-ID or slug match must be backed by a second signal: the
 * homepage domains agree, or the names agree and nothing contradicts them
 * (different homepage domain, different base). IDs get reused for unrelated
 * distros, and names collide, so neither is enough alone. Dropped matches
 * are logged and the item is left alone (not created).
 *
 * Wikidata only fills empty fields; curated or earlier values always win and
 * a disagreement is logged. Items we don't track are created with
 * `discovered_via = 'wikidata'` (family "other"), so they stay off public
 * lists until a rank, repo or rating shows up. Dissolved items are never
 * created. Idempotent: a second run with the same data changes nothing.
 */
export async function ingestWikidataDistros(db: Database, items: WikidataDistro[]): Promise<WikidataIngestResult> {
  const result: WikidataIngestResult = { matched: 0, filled: [], discovered: [], conflicts: [], rejected: [] };

  // 1. Candidate matches, in memory.
  const cand = new Map<string, { id: number; via: Via }>();
  const claimed = new Set<number>();
  // Hand-checked pins count as an existing alias.
  for (const [slug, qid] of Object.entries(WIKIDATA_PINS)) {
    const id = await findDistroIdBySlug(db, slug);
    if (id != null && items.some((x) => x.qid === qid)) {
      cand.set(qid, { id, via: "alias" });
      claimed.add(id);
    }
  }
  for (const it of items) {
    if (cand.has(it.qid)) continue;
    let id = await findDistroIdByAlias(db, "wikidata", it.qid);
    let via: Via = "alias";
    for (const k of it.distrowatchKeys) {
      if (id != null) break;
      id = await findDistroIdByAlias(db, "distrowatch", k);
      via = "distrowatch";
    }
    if (id != null && !claimed.has(id)) {
      cand.set(it.qid, { id, via });
      claimed.add(id);
    }
  }
  const unmatchedByName: WikidataDistro[] = [];
  for (const it of items) {
    if (cand.has(it.qid)) continue;
    const bySlug = await findDistroIdBySlug(db, slugify(it.name));
    if (bySlug != null && !claimed.has(bySlug) && (await externalAliasCount(db, bySlug)) === 0) {
      cand.set(it.qid, { id: bySlug, via: "slug" });
      claimed.add(bySlug);
    } else {
      unmatchedByName.push(it);
    }
  }

  // 2. Validate new matches against a second signal.
  const rowById = new Map<number, DistroRow>();
  for (const { id } of cand.values()) {
    const row = await getDistroRow(db, id);
    if (row) rowById.set(id, row);
  }
  const baseSlugOf = (it: WikidataDistro, selfId: number): string | null => {
    const ids = it.baseQids.map((q) => cand.get(q)?.id).filter((x): x is number => x != null && x !== selfId);
    return ids.length === 1 ? (rowById.get(ids[0]!)?.slug ?? null) : null;
  };
  const familyOf = async (slug: string): Promise<string | null> => {
    const curated = CURATED[slug]?.family;
    if (curated && curated !== "other") return curated;
    const id = await findDistroIdBySlug(db, slug);
    const fam = id != null ? (await getDistroRow(db, id))?.family : null;
    return fam && fam !== "other" ? fam : null;
  };
  const rejectedQids = new Set<string>();
  for (const it of items) {
    const c = cand.get(it.qid);
    if (!c || c.via === "alias") continue;
    const row = rowById.get(c.id)!;
    const ourBaseSlug = row.basedOnSlug ?? CURATED[row.slug]?.basedOn ?? null;
    const theirBaseSlug = baseSlugOf(it, c.id);
    const ourSite = row.homepage ?? CURATED[row.slug]?.homepage ?? null;
    const reason = matchProblem(
      row.name,
      ourSite,
      ourBaseSlug ? { slug: ourBaseSlug, family: await familyOf(ourBaseSlug) } : null,
      it,
      theirBaseSlug ? { slug: theirBaseSlug, family: await familyOf(theirBaseSlug) } : null,
    );
    if (reason) {
      rejectedQids.add(it.qid);
      result.rejected.push(`${row.slug} <- ${it.name} (${it.qid}): ${reason}`);
    }
  }
  for (const q of rejectedQids) cand.delete(q);

  // 3. Write aliases; create discovered distros for items nobody claims.
  const idByQid = new Map<string, number>();
  for (const it of items) {
    const c = cand.get(it.qid);
    if (c) {
      await addAlias(db, "wikidata", it.qid, c.id);
      if (it.enwikiTitle) await addAlias(db, "enwiki", it.enwikiTitle, c.id);
      idByQid.set(it.qid, c.id);
      result.matched += 1;
    }
  }
  for (const it of unmatchedByName) {
    if (it.dissolved || rejectedQids.has(it.qid)) continue;
    // An item whose DistroWatch ID belongs to one of our distros was looked at
    // in step 1; if it isn't matched now, it was dropped there.
    if (await anyKnownDistrowatchKey(db, it)) continue;
    const slug = await freeSlug(db, slugify(it.name), it.qid);
    const id = await insertDiscoveredDistro(
      db,
      { slug, name: it.name, family: "other", status: "active", homepage: it.homepage, firstReleaseYear: it.firstReleaseYear },
      "wikidata",
    );
    await addAlias(db, "wikidata", it.qid, id);
    if (it.enwikiTitle) await addAlias(db, "enwiki", it.enwikiTitle, id);
    idByQid.set(it.qid, id);
    result.discovered.push(slug);
  }

  // 4. Fill blanks (base resolved through our own ids).
  for (const it of items) {
    const id = idByQid.get(it.qid);
    if (id == null) continue;
    const slug = (await findDistroSlugById(db, id))!;
    const curated = CURATED[slug];
    const baseIds = it.baseQids.map((q) => idByQid.get(q)).filter((x): x is number => x != null && x !== id);
    const baseSlug = baseIds.length === 1 ? await findDistroSlugById(db, baseIds[0]!) : null;
    const filled = await fillDistroBlanks(db, id, {
      basedOnSlug: curated ? null : baseSlug,
      homepage: it.homepage,
      firstReleaseYear: it.firstReleaseYear,
    });
    for (const f of filled) result.filled.push(`${slug}.${f}`);
    const checked = (field: string) => `${slug}.${field}` in CHECKED_AGAINST_WIKIDATA;
    if (curated?.firstReleaseYear != null && it.firstReleaseYear != null && Math.abs(curated.firstReleaseYear - it.firstReleaseYear) > 1 && !checked("firstReleaseYear")) {
      result.conflicts.push(`${slug}.firstReleaseYear: ${curated.firstReleaseYear} vs ${it.firstReleaseYear}`);
    }
    if (curated?.basedOn && baseSlug && curated.basedOn !== baseSlug && !checked("basedOn")) {
      result.conflicts.push(`${slug}.basedOn: ${curated.basedOn} vs ${baseSlug}`);
    }
  }
  return result;
}

/** Hostname without "www.", or null. */
export function siteDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function sameSite(a: string | null, b: string | null): boolean | null {
  const da = siteDomain(a);
  const db = siteDomain(b);
  if (!da || !db) return null;
  return da === db || da.endsWith(`.${db}`) || db.endsWith(`.${da}`);
}

const FILLER = new Set(["linux", "gnu", "os", "distribution", "edition"]);
const FILLER_RE = /gnu|linux|os|distribution|edition/g;

/**
 * Names agree when their words (minus filler like "Linux", "OS") are equal or
 * one set contains the other, or when they match with spaces and filler
 * removed ("AV Linux" = "AVLinux", "Big Linux" = "BigLinux").
 */
export function sameName(a: string, b: string): boolean {
  const words = (s: string) => slugify(s).split("-").filter((w) => w && !FILLER.has(w));
  const compact = (s: string) => slugify(s).replace(/-/g, "").replace(FILLER_RE, "");
  const ca = compact(a);
  if (ca && ca === compact(b)) return true;
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) return slugify(a) === slugify(b);
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  return short.every((w) => long.includes(w));
}

/**
 * Why a candidate match should be dropped, or null when it's backed by a
 * second signal. A different base only counts when it's in another family
 * (Debian vs MX is one lineage; Fedora vs Ubuntu is a different distro).
 */
export function matchProblem(
  ourName: string,
  ourSite: string | null,
  ourBase: { slug: string; family: string | null } | null,
  it: WikidataDistro,
  theirBase: { slug: string; family: string | null } | null,
): string | null {
  const site = sameSite(ourSite, it.homepage);
  if (site === true) return null;
  if (!sameName(ourName, it.name)) return `name differs ("${ourName}" vs "${it.name}")`;
  if (site === false) return `homepage differs (${siteDomain(ourSite)} vs ${siteDomain(it.homepage)})`;
  if (ourBase && theirBase && ourBase.slug !== theirBase.slug && ourBase.family && theirBase.family && ourBase.family !== theirBase.family) {
    return `base differs (${ourBase.slug} vs ${theirBase.slug})`;
  }
  return null;
}

async function externalAliasCount(db: Database, distroId: number): Promise<number> {
  return (await aliasesFor(db, distroId)).filter((a) => a.source === "wikidata" || a.source === "distrowatch").length;
}

async function anyKnownDistrowatchKey(db: Database, it: WikidataDistro): Promise<boolean> {
  for (const k of it.distrowatchKeys) if ((await findDistroIdByAlias(db, "distrowatch", k)) != null) return true;
  return false;
}

/** `base`, or `base-q123` if `base` is taken (or empty). */
async function freeSlug(db: Database, base: string, qid: string): Promise<string> {
  const plain = base || qid.toLowerCase();
  if ((await findDistroIdBySlug(db, plain)) == null) return plain;
  return `${plain}-${qid.toLowerCase()}`;
}
