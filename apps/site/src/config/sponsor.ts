export interface Sponsor {
  name: string;
  logoUrl: string;
  href: string;
  tagline: string;
  /** First day of the paid term, YYYY-MM-DD (UTC). Omit for "already running". */
  startsOn?: string;
  /** Last day of the paid term, YYYY-MM-DD (UTC), inclusive. Omit for open-ended. */
  endsOn?: string;
}

/** The configured sponsor, or null when the slot is open (the launch state). */
export const configuredSponsor: Sponsor | null = null;

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

/**
 * The sponsor to show at build time: the configured one while its term runs,
 * else null so every placement falls back to the house ad.
 */
export const sponsor: Sponsor | null = sponsorIsActive(configuredSponsor) ? configuredSponsor : null;
