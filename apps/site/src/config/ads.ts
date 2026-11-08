/**
 * EthicalAds (contextual, no cookies, no tracking). Off until the site reaches
 * EthicalAds' minimum traffic and the owner's application is accepted. While
 * `enabled` is false nothing renders and no script is loaded; the privacy page
 * text for it is hidden too.
 */
export interface EthicalAdsConfig {
  enabled: boolean;
  publisherId: string;
  keywords: readonly string[];
}

export const ethicalAds: EthicalAdsConfig = {
  enabled: false,
  /** Publisher id from the EthicalAds dashboard, e.g. "linuxstatistics". */
  publisherId: "",
  /** Keywords EthicalAds may use to pick a contextual ad. */
  keywords: ["linux", "devops", "open-source", "sysadmin"],
};

export type AdPlacement = "distro" | "compare";
