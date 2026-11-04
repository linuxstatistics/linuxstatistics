import {
  sponsor as configuredSponsor,
  sponsorContactHref,
  type Sponsor,
} from "../config/sponsor";

export function SponsorSlot({
  sponsor = configuredSponsor,
  contactHref = sponsorContactHref,
}: {
  sponsor?: Sponsor | null;
  contactHref?: string;
}) {
  if (!sponsor) {
    return (
      <div className="sponsor-slot sponsor-slot-empty">
        <span className="sponsor-label">Sponsor</span>
        <a href={contactHref} className="sponsor-house-ad">
          Sponsorships available. Get in touch
        </a>
      </div>
    );
  }
  return (
    <div className="sponsor-slot">
      <span className="sponsor-label">Sponsor</span>
      <a href={sponsor.href} target="_blank" rel="sponsored noopener" className="sponsor-link">
        <img src={sponsor.logoUrl} alt={sponsor.name} className="sponsor-logo" />
        <span className="sponsor-tagline">{sponsor.tagline}</span>
      </a>
    </div>
  );
}
