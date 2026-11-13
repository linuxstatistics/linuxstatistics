import { affiliateProviders, type AffiliateProvider } from "../config/affiliate";

export function AffiliateBlock({
  providers = affiliateProviders,
}: {
  providers?: AffiliateProvider[];
}) {
  if (providers.length === 0) return null;
  return (
    <section className="affiliate-block" id="cloud" aria-label="Try Linux in the cloud">
      <h3>Try Linux in the cloud</h3>
      <p className="affiliate-disclosure">Affiliate links: we may earn a commission.</p>
      <ul className="affiliate-providers">
        {providers.map((p) => (
          <li key={p.name}>
            <a href={p.href} target="_blank" aria-describedby="new-tab-description" title="Opens in a new tab" rel="nofollow sponsored noopener">
              Deploy a server on {p.name} <span className="icon-arrow" aria-hidden="true" />
            </a>
            <span className="affiliate-blurb">{p.blurb}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
