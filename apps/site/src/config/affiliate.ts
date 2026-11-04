export interface AffiliateProvider {
  name: string;
  href: string;
  blurb: string;
}

/**
 * VPS referral links shown on distro pages. The owner replaces `href` with real
 * referral URLs (these are public — referral codes appear in the browser anyway).
 * Copy stays generic/honest; we never claim a specific distro is offered by a
 * provider. An empty array hides the block.
 */
export const affiliateProviders: AffiliateProvider[] = [
  { name: "DigitalOcean", href: "https://www.digitalocean.com/", blurb: "from $4/mo" },
  { name: "Linode", href: "https://www.linode.com/", blurb: "from $5/mo" },
  { name: "Vultr", href: "https://www.vultr.com/", blurb: "from $2.50/mo" },
];
