import type { DistroDetail, DistroListItem } from "@linux-statistics/shared";
import { PROFILES } from "../../site/src/lib/picker-profiles.js";
import { NOTES } from "../../site/src/lib/distro-notes.js";
import { TELEMETRY } from "../../site/src/lib/telemetry.js";
import { DISTRO_BLURBS } from "../../site/src/lib/distro-blurbs.js";
import { GITHUB_REPOS } from "./github-repos.js";
import { ENDOFLIFE_PRODUCTS } from "./sources/endoflife.js";
import { WIKIDATA_ENDPOINT, WIKIDATA_SPARQL, parseWikidataDistros, type WikidataDistro } from "./sources/wikidata.js";
import { politeGet, type FetchLike } from "./http.js";

/**
 * Data-gap report: for each ranked distro, which curated or fetched pieces are
 * missing, plus proposals from free sources (endoflife.date products, Wikidata
 * source repositories). Read-only: it never writes curated files or the
 * database. A person reviews the proposals and commits the ones that check out.
 */

export const GAP_FIELDS = ["profile", "notes", "telemetry", "summary", "releaseYear", "homepage", "repo", "releases"] as const;
export type GapField = (typeof GAP_FIELDS)[number];

export const GAP_LABEL: Record<GapField, string> = {
  profile: "quiz profile",
  notes: "pros and cons",
  telemetry: "telemetry check",
  summary: "summary",
  releaseYear: "first release year",
  homepage: "homepage",
  repo: "GitHub repo",
  releases: "release dates",
};

export interface Proposal {
  slug: string;
  kind: "endoflife" | "github";
  value: string;
  why: string;
}

export interface GapRow {
  slug: string;
  name: string;
  rank: number;
  missing: GapField[];
}

export interface GapReport {
  generatedAt: string;
  /** Ranked distros considered (top N by rank). */
  considered: number;
  rows: GapRow[];
  /** Ranked distros with no editorial data at all, newest in the top N. */
  newUnprofiled: string[];
  proposals: Proposal[];
}

type Detail = Pick<DistroDetail, "slug" | "homepage" | "description" | "releases" | "repoFullName" | "firstReleaseYear">;

const have = {
  profile: new Set(PROFILES.map((p) => p.key)),
  notes: new Set(NOTES.map((n) => n.key)),
  telemetry: new Set(TELEMETRY.map((t) => t.key)),
  repo: new Set(GITHUB_REPOS.map((r) => r.key)),
};

/** What one distro is missing. */
export function missingFor(d: DistroListItem, x: Detail | undefined): GapField[] {
  const m: GapField[] = [];
  if (!have.profile.has(d.slug)) m.push("profile");
  if (!have.notes.has(d.slug)) m.push("notes");
  if (!have.telemetry.has(d.slug)) m.push("telemetry");
  if (!have.profile.has(d.slug) && !DISTRO_BLURBS[d.slug] && !x?.description) m.push("summary");
  if (d.firstReleaseYear == null) m.push("releaseYear");
  if (!x?.homepage) m.push("homepage");
  if (!d.repoFullName && !have.repo.has(d.slug)) m.push("repo");
  if (!x?.releases?.length && !(d.slug in ENDOFLIFE_PRODUCTS)) m.push("releases");
  return m;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** endoflife.date OS products we don't map yet whose name equals one of ours. Name-only, so always a proposal. */
export function endoflifeProposals(products: { name: string; label?: string | null; category?: string | null }[], ranked: DistroListItem[]): Proposal[] {
  const mapped = new Set(Object.values(ENDOFLIFE_PRODUCTS));
  const out: Proposal[] = [];
  for (const p of products) {
    if (p.category !== "os" || mapped.has(p.name)) continue;
    const keys = [p.name, p.label ?? ""].map(norm).filter(Boolean);
    const hit = ranked.find((d) => !(d.slug in ENDOFLIFE_PRODUCTS) && (keys.includes(norm(d.slug)) || keys.includes(norm(d.name))));
    if (hit) out.push({ slug: hit.slug, kind: "endoflife", value: p.name, why: `endoflife.date "${p.label ?? p.name}" has the same name as ${hit.name}` });
  }
  return out;
}

const domain = (url: string | null | undefined) => {
  try {
    return url ? new URL(url).hostname.toLowerCase().replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};

/**
 * Wikidata source repositories on GitHub for ranked distros without a curated
 * repo. Items are tied to our distros by the English Wikipedia article we
 * already show, else by an identical homepage domain.
 */
export function githubProposals(items: WikidataDistro[], ranked: DistroListItem[], details: Map<string, Detail>): Proposal[] {
  const byTitle = new Map(items.filter((i) => i.enwikiTitle).map((i) => [i.enwikiTitle!.replace(/ /g, "_"), i]));
  const byDomain = new Map<string, WikidataDistro[]>();
  for (const i of items) {
    const dom = domain(i.homepage);
    if (dom) byDomain.set(dom, [...(byDomain.get(dom) ?? []), i]);
  }
  const out: Proposal[] = [];
  for (const d of ranked) {
    if (d.repoFullName || have.repo.has(d.slug)) continue;
    const x = details.get(d.slug);
    const title = x?.description?.title?.replace(/ /g, "_");
    const dom = domain(x?.homepage);
    const sameDomain = dom ? byDomain.get(dom) : undefined;
    const it = (title && byTitle.get(title)) || (sameDomain?.length === 1 ? sameDomain[0] : undefined);
    for (const r of it?.githubRepos ?? []) {
      out.push({ slug: d.slug, kind: "github", value: r, why: r.includes("/") ? `Wikidata ${it!.qid} source repository` : `Wikidata ${it!.qid} names the GitHub org; pick the repo that stands for the distro` });
    }
  }
  return out;
}

export function buildReport(ranked: DistroListItem[], details: Map<string, Detail>, proposals: Proposal[], now = new Date()): GapReport {
  const rows = ranked.map((d) => ({ slug: d.slug, name: d.name, rank: d.rank!, missing: missingFor(d, details.get(d.slug)) })).filter((r) => r.missing.length > 0);
  const editorial: GapField[] = ["profile", "notes", "telemetry"];
  return {
    generatedAt: now.toISOString(),
    considered: ranked.length,
    rows,
    newUnprofiled: rows.filter((r) => editorial.every((f) => r.missing.includes(f))).map((r) => r.slug),
    proposals,
  };
}

/** Markdown summary for the Actions run page and the terminal. */
export function reportMarkdown(r: GapReport, top = 25): string {
  const count = (f: GapField) => r.rows.filter((x) => x.missing.includes(f)).length;
  const lines = [
    `## Data gaps (top ${r.considered} ranked distros)`,
    "",
    "| Missing | Distros |",
    "|---|---|",
    ...GAP_FIELDS.map((f) => `| ${GAP_LABEL[f]} | ${count(f)} |`),
    "",
    `### Highest-ranked gaps`,
    "",
    ...r.rows.slice(0, top).map((x) => `- #${x.rank} ${x.name} (\`${x.slug}\`): ${x.missing.map((f) => GAP_LABEL[f]).join(", ")}`),
  ];
  if (r.proposals.length) {
    lines.push("", "### Proposals to review (not applied)", "", ...r.proposals.map((p) => `- \`${p.slug}\` ${p.kind}: \`${p.value}\` (${p.why})`));
  }
  return `${lines.join("\n")}\n`;
}

async function getJson<T>(url: string, opts: { fetch?: FetchLike; headers?: Record<string, string> } = {}): Promise<T> {
  const res = await politeGet(url, { fetch: opts.fetch, headers: { Accept: "application/json", ...opts.headers } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return (await res.json()) as T;
}

/** Collect everything from the API and the two free sources. */
export async function collectReport(opts: { api: string; top?: number; fetch?: FetchLike; now?: Date; log?: (m: string) => void }): Promise<GapReport> {
  const top = opts.top ?? 200;
  const log = opts.log ?? (() => {});
  const list = await getJson<DistroListItem[]>(`${opts.api}/api/distros`, opts);
  const ranked = list.filter((d) => d.rank != null).sort((a, b) => a.rank! - b.rank!).slice(0, top);
  const details = new Map<string, Detail>();
  for (const d of ranked) details.set(d.slug, await getJson<Detail>(`${opts.api}/api/distros/${encodeURIComponent(d.slug)}`, opts));

  const proposals: Proposal[] = [];
  try {
    const eol = await getJson<{ result: { name: string; label?: string; category?: string }[] }>("https://endoflife.date/api/v1/products", opts);
    proposals.push(...endoflifeProposals(eol.result, ranked));
  } catch (err) {
    log(`gaps: endoflife.date skipped (${err instanceof Error ? err.message : err})`);
  }
  try {
    const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(WIKIDATA_SPARQL)}`;
    const items = parseWikidataDistros(await getJson(url, { ...opts, headers: { Accept: "application/sparql-results+json" } }));
    proposals.push(...githubProposals(items, ranked, details));
  } catch (err) {
    log(`gaps: Wikidata skipped (${err instanceof Error ? err.message : err})`);
  }
  return buildReport(ranked, details, proposals, opts.now);
}
