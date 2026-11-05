/**
 * Ways to support the site. Public, no secrets. Leave a value empty ("") to
 * hide that option; the whole support block hides when everything is empty.
 * TODO(owner): fill in real handles and addresses before launch.
 */
export interface SupportLink {
  name: string;
  href: string;
  note: string;
}

export interface CryptoAddress {
  name: string;
  /** URI scheme for wallet apps: "bitcoin", "lightning", "monero". */
  scheme: string;
  address: string;
}

export const SUPPORT_LINKS: SupportLink[] = [
  { name: "GitHub Sponsors", href: "", note: "monthly or one-off, no fees" },
  { name: "Ko-fi", href: "", note: "one-off tip" },
  { name: "Patreon", href: "", note: "monthly" },
  { name: "PayPal", href: "", note: "one-off" },
].filter((l) => l.href);

export const CRYPTO_ADDRESSES: CryptoAddress[] = [
  { name: "Bitcoin", scheme: "bitcoin", address: "" },
  { name: "Lightning", scheme: "lightning", address: "" },
  { name: "Monero", scheme: "monero", address: "" },
].filter((c) => c.address);

export const hasSupport = SUPPORT_LINKS.length > 0 || CRYPTO_ADDRESSES.length > 0;
