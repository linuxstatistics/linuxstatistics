import type { DistroListItem } from "@linux-statistics/shared";
import { DISTRO_IMAGES, DISTRO_MARKS } from "./distro-marks";
import { SCREENSHOTS, SHOTS_CHECKED } from "./screenshots";

export interface VisualRow {
  slug: string;
  name: string;
  rank: number;
}

export interface VisualGaps {
  /** Ranked distros shown with a monogram (no simple-icons mark and no image), highest-ranked first. */
  monograms: VisualRow[];
  /** Ranked distros with no screenshot. */
  noScreenshot: VisualRow[];
  /** Screenshots flagged as two or more major releases old. */
  stale: (VisualRow & { caption: string; source: string })[];
  shotsChecked: string;
  logos: number;
  screenshots: number;
}

/**
 * What the visuals still lack, for the admin visuals page. Built from the
 * curated logo and screenshot lists; `top` limits the ranked distros considered.
 */
export function visualGaps(list: DistroListItem[], top = 100): VisualGaps {
  const ranked = list.filter((d) => d.rank != null).sort((a, b) => a.rank! - b.rank!).slice(0, top);
  const row = (d: DistroListItem): VisualRow => ({ slug: d.slug, name: d.name, rank: d.rank! });
  const rankOf = new Map(list.filter((d) => d.rank != null).map((d) => [d.slug, d]));
  return {
    monograms: ranked.filter((d) => !DISTRO_MARKS[d.slug] && !DISTRO_IMAGES[d.slug]).map(row),
    noScreenshot: ranked.filter((d) => !SCREENSHOTS[d.slug]).map(row),
    stale: Object.entries(SCREENSHOTS)
      .filter(([, s]) => s.stale)
      .map(([slug, s]) => {
        const d = rankOf.get(slug);
        return { slug, name: d?.name ?? slug, rank: d?.rank ?? Number.MAX_SAFE_INTEGER, caption: s.caption, source: s.source };
      })
      .sort((a, b) => a.rank - b.rank),
    shotsChecked: SHOTS_CHECKED,
    logos: Object.keys(DISTRO_MARKS).length + Object.keys(DISTRO_IMAGES).length,
    screenshots: Object.keys(SCREENSHOTS).length,
  };
}
