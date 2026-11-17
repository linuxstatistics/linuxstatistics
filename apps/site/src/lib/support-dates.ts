import type { DistroDetail } from "@linux-statistics/shared";

export interface SupportRow {
  slug: string;
  name: string;
  /** Release shown, e.g. "24.04.3 LTS". */
  release: string;
  releasedOn: string | null;
  /** Regular support end (YYYY-MM-DD). */
  ends: string;
  /** Extended support end, when later than `ends`. */
  extended: string | null;
}

/**
 * The newest released cycle per distro with a known end date, soonest end first.
 * Cycles not yet released are skipped; distros without dates are left out.
 */
export function supportRows(details: Pick<DistroDetail, "slug" | "name" | "releases">[], today = new Date().toISOString().slice(0, 10)): SupportRow[] {
  const out: SupportRow[] = [];
  for (const d of details) {
    const cur = d.releases.find((r) => r.releasedOn != null && r.releasedOn <= today) ?? null;
    if (!cur) continue;
    const ends = cur.supportEnds ?? cur.eol;
    if (!ends) continue;
    out.push({
      slug: d.slug,
      name: d.name,
      release: `${cur.latest ?? cur.cycle}${cur.lts ? " LTS" : ""}`,
      releasedOn: cur.releasedOn,
      ends,
      extended: cur.eol && cur.supportEnds && cur.eol > cur.supportEnds ? cur.eol : null,
    });
  }
  return out.sort((a, b) => a.ends.localeCompare(b.ends) || a.name.localeCompare(b.name));
}

/** Rows whose support ends within `months` from today (still supported today). */
export function endingSoon(rows: SupportRow[], today = new Date().toISOString().slice(0, 10), months = 6): SupportRow[] {
  const t = new Date(`${today}T00:00:00Z`);
  t.setUTCMonth(t.getUTCMonth() + months);
  const limit = t.toISOString().slice(0, 10);
  return rows.filter((r) => r.ends >= today && r.ends <= limit);
}
