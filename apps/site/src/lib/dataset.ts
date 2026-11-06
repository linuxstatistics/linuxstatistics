import type { DistroListItem, MarketSharePoint } from "@linux-statistics/shared";
import { NOTES } from "./distro-notes";
import { TELEMETRY } from "./telemetry";
import { PROFILES } from "./picker-profiles";
import { FAMILY_LABELS } from "./families";

/** Bump on breaking changes to any file's shape; list changes on /data/. */
export const DATASET_VERSION = "2.0.0";
export const DATA_LICENSE = "CC-BY-4.0";
export const DATA_CREDIT = "Data: LinuxStatistics (linuxstatistics.com), CC BY 4.0";

export interface DataSource {
  name: string;
  url: string;
  note?: string;
}

/** Third-party sources whose data appears in the exports. Ranking-site data is never exported. */
export const SOURCES: Record<"statcounter" | "github", DataSource> = {
  statcounter: { name: "StatCounter Global Stats", url: "https://gs.statcounter.com/os-market-share/desktop/worldwide" },
  github: { name: "GitHub", url: "https://github.com/" },
};

export function envelope<T>(generatedAt: string, data: T, sources: (keyof typeof SOURCES)[] = []) {
  return {
    version: DATASET_VERSION,
    generatedAt,
    license: DATA_LICENSE,
    credit: DATA_CREDIT,
    sources: sources.map((k) => SOURCES[k]),
    data,
  };
}

export const DISTRO_COLUMNS = [
  "slug", "name", "family", "status", "first_release_year", "github_repo", "github_stars", "github_commits_30d",
  "rating_average", "rating_count", "uses_it_count",
] as const;

export function distroRow(d: DistroListItem): (string | number | null)[] {
  return [
    d.slug, d.name, d.family, d.status, d.firstReleaseYear, d.repoFullName, d.stars, d.commitsLast30d,
    d.userRating.count > 0 ? Number((d.userRating.average ?? 0).toFixed(2)) : null, d.userRating.count, d.usesItCount,
  ];
}

/** Alphabetical by name, then slug, so the order doesn't depend on any ranking. */
export function byName(list: DistroListItem[]): DistroListItem[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
}

export function distroRecord(d: DistroListItem) {
  return Object.fromEntries(DISTRO_COLUMNS.map((c, i) => [c, distroRow(d)[i]]));
}

/** Our editorial data: who it suits, pros/cons, telemetry with sources. */
export function notesDataset() {
  const profile = new Map(PROFILES.map((p) => [p.key, p]));
  const tel = new Map(TELEMETRY.map((t) => [t.key, t]));
  const keys = [...new Set([...NOTES.map((n) => n.key), ...TELEMETRY.map((t) => t.key)])].sort();
  return keys.map((key) => {
    const n = NOTES.find((x) => x.key === key);
    const p = profile.get(key);
    const t = tel.get(key);
    return {
      slug: key,
      suits: p ? { levels: p.levels, uses: p.uses, updates: p.updates, desktops: p.desktops, blurb: p.blurb } : null,
      pros: n?.pros ?? [],
      cons: n?.cons ?? [],
      telemetry: t ? { level: t.level, detail: t.detail, turnOff: t.turnOff ?? null, source: t.source, checked: t.checked } : null,
    };
  });
}

export function marketShareRows(points: MarketSharePoint[]) {
  return [...points]
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt) || a.platform.localeCompare(b.platform))
    .map((p) => [p.capturedAt.slice(0, 7), p.region, p.platform, p.sharePct]);
}

export const familyLabel = (f: DistroListItem["family"]) => FAMILY_LABELS[f];
