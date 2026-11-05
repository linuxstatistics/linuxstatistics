export interface Sponsor {
  name: string;
  logoUrl: string;
  href: string;
  tagline: string;
}

/** The current sponsor, or null when the slot is open (the launch state). */
export const sponsor: Sponsor | null = null;

/** Where the "Sponsorships available" house ad points: the sponsors page. */
export const sponsorContactHref = "/sponsors/";
