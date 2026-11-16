/** Public site facts used on the About, Privacy, Terms and Sponsors pages. No secrets. */
export const OPERATOR = { name: "Chris Hartman", country: "United States" };

export const CONTACT = {
  general: "hello@linuxstatistics.com",
  sponsor: "sponsor@linuxstatistics.com",
  privacy: "privacy@linuxstatistics.com",
};

export const SOURCE_URL = "https://github.com/linuxstatistics/linuxstatistics";

/** Official accounts: footer, search menu "Follow" group and Organization sameAs. Mastodon links carry rel="me". */
export const SOCIAL: { name: string; handle: string; href: string; relMe?: true }[] = [
  { name: "X", handle: "@linuxstatistics", href: "https://x.com/linuxstatistics" },
  { name: "Bluesky", handle: "@linuxstatistics.bsky.social", href: "https://bsky.app/profile/linuxstatistics.bsky.social" },
  { name: "Mastodon", handle: "@linuxstatistics@mastodon.social", href: "https://mastodon.social/@linuxstatistics", relMe: true },
];

/** Search-engine site verification tokens (public by design). Empty = tag not rendered. */
export const SEARCH_VERIFY = { bing: "", google: "" };

/** Date the legal pages last changed (YYYY-MM-DD). Update when the text changes. */
export const POLICIES_UPDATED = "2026-11-15";
