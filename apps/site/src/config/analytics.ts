/**
 * Umami (cookieless page-view counts). Off unless PUBLIC_UMAMI_WEBSITE_ID is
 * set at build time; the privacy page text follows the same switch. The
 * website id is public (it ends up in the page), not a secret.
 */
export interface AnalyticsConfig {
  enabled: boolean;
  websiteId: string;
  scriptUrl: string;
  /** Only these hosts send data, so previews and local builds don't count. */
  domains: string;
}

const websiteId = (import.meta.env.PUBLIC_UMAMI_WEBSITE_ID ?? "").trim();

export const analytics: AnalyticsConfig = {
  enabled: websiteId !== "",
  websiteId,
  scriptUrl: import.meta.env.PUBLIC_UMAMI_SCRIPT_URL ?? "https://cloud.umami.is/script.js",
  domains: "linuxstatistics.com",
};
