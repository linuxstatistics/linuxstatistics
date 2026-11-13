/**
 * Affiliate partners behind `/go/<partner>`. Public config, no secrets: the
 * referral URL appears in the browser anyway. The API redirects and counts;
 * the site links to `/go/<partner>` so clicks are counted whatever page they
 * come from. Only cash programs the owner has joined belong here.
 */
export interface AffiliatePartner {
  /** URL-safe key used in `/go/<partner>` and the click table. */
  slug: string;
  name: string;
  /** Referral URL. Replace with the real one on joining the program. */
  href: string;
  /** Short honest price line shown next to the link. */
  blurb: string;
  /** True once `href` is a real referral link from a joined program. Only live partners appear on the site. */
  live: boolean;
}

export const AFFILIATE_PARTNERS: readonly AffiliatePartner[] = [
  { slug: "digitalocean", name: "DigitalOcean", href: "https://www.digitalocean.com/", blurb: "from $4/mo", live: false },
  { slug: "vultr", name: "Vultr", href: "https://www.vultr.com/", blurb: "from $2.50/mo", live: false },
];

export function affiliatePartner(slug: string): AffiliatePartner | undefined {
  return AFFILIATE_PARTNERS.find((p) => p.slug === slug);
}

/** Path on our own origin that counts the click and redirects (under /api so one proxy rule covers it). */
export const affiliateGoPath = (slug: string) => `/api/go/${slug}`;
