import { AFFILIATE_PARTNERS, affiliateGoPath, type AffiliatePartner } from "@linux-statistics/shared";

export interface AffiliateProvider {
  name: string;
  /** Our own `/api/go/<partner>` link: the API counts the click and redirects. */
  href: string;
  blurb: string;
}

const toProvider = (p: AffiliatePartner): AffiliateProvider => ({ name: p.name, href: affiliateGoPath(p.slug), blurb: p.blurb });

/**
 * VPS referral links shown on distro pages and the switch pages. The list and the
 * referral URLs live in `packages/shared/src/affiliates.ts` so the API redirect
 * and the site agree. Copy stays generic and honest; we never claim a specific
 * distro is offered by a provider. Only partners marked `live` (real referral
 * link) are shown; none live hides the block.
 */
export const affiliateProviders: AffiliateProvider[] = AFFILIATE_PARTNERS.filter((p) => p.live).map(toProvider);
