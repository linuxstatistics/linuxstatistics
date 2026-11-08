import { ethicalAds, type AdPlacement, type EthicalAdsConfig } from "../config/ads";

/**
 * One labelled EthicalAds placement in the content column. Renders nothing
 * while ads are off; when on, the EthicalAds client script fills the slot.
 * Never placed next to the sponsor card or inside a ranking table.
 */
export function EthicalAd({ placement, config = ethicalAds }: { placement: AdPlacement; config?: EthicalAdsConfig }) {
  if (!config.enabled || !config.publisherId) return null;
  return (
    <aside className="ethical-ad" aria-label="Advertisement">
      <span className="ethical-ad-label">Ad</span>
      <div
        data-ea-publisher={config.publisherId}
        data-ea-type="text"
        data-ea-keywords={config.keywords.join("|")}
        data-ea-manual="false"
        id={`ea-${placement}`}
        className="horizontal"
      />
      <script async src="https://media.ethicalads.io/media/client/ethicalads.min.js" />
    </aside>
  );
}
