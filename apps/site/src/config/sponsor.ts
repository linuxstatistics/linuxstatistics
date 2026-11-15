export type SponsorTier = "headline" | "guide" | "supporter";

export interface Sponsor {
  name: string;
  logoUrl: string;
  href: string;
  tagline: string;
  /** Which placement this sponsor buys. Omitted = headline (the original single slot). */
  tier?: SponsorTier;
  /** First day of the paid term, YYYY-MM-DD (UTC). Omit for "already running". */
  startsOn?: string;
  /** Last day of the paid term, YYYY-MM-DD (UTC), inclusive. Omit for open-ended. */
  endsOn?: string;
}

/**
 * Every booked sponsor, any tier. One headline and one guide sponsor at a time;
 * up to SUPPORTER_LIMIT supporters. Empty at launch.
 */
export const configuredSponsors: Sponsor[] = [];

/** Supporters shown at once in the footer row. */
export const SUPPORTER_LIMIT = 6;

/** Where the "Sponsorships available" house ad points: the sponsors page. */
export const sponsorContactHref = "/sponsors/";

/** True when `now` falls inside the sponsor's term (dates are whole UTC days, inclusive). */
export function sponsorIsActive(s: Sponsor | null, now: Date = new Date()): s is Sponsor {
  if (!s) return false;
  const day = now.toISOString().slice(0, 10);
  if (s.startsOn && day < s.startsOn) return false;
  if (s.endsOn && day > s.endsOn) return false;
  return true;
}

/** Active sponsors by tier: the first active headline and guide sponsor, and up to SUPPORTER_LIMIT supporters. */
export function activeSponsors(all: Sponsor[], now: Date = new Date()) {
  const live = all.filter((s) => sponsorIsActive(s, now));
  const of = (t: SponsorTier) => live.filter((s) => (s.tier ?? "headline") === t);
  return {
    headline: of("headline")[0] ?? null,
    guide: of("guide")[0] ?? null,
    supporters: of("supporter").slice(0, SUPPORTER_LIMIT),
  };
}

/** Sponsors to show at build time; expired terms fall back to the house ads. */
export const sponsors = activeSponsors(configuredSponsors);

/** The headline sponsor (sidebar card everywhere and the footer slot), or null. */
export const sponsor: Sponsor | null = sponsors.headline;
