import { sponsor as configuredSponsor, sponsorContactHref, type Sponsor } from "../config/sponsor";

/**
 * Sidebar sponsor card. Shows the current sponsor, or a labelled house ad when
 * the slot is open. Always marked "Sponsor"; never affects rankings.
 */
export function SponsorCard({
  sponsor = configuredSponsor,
  contactHref = sponsorContactHref,
  context = "people choosing a Linux distro",
}: {
  sponsor?: Sponsor | null;
  contactHref?: string;
  /** Who sees this placement, for the house-ad pitch. */
  context?: string;
}) {
  if (sponsor) {
    return (
      <aside className="sponsor-card" aria-label="Sponsor">
        <span className="sponsor-card-label">Sponsor</span>
        <a href={sponsor.href} target="_blank" rel="sponsored nofollow noopener" className="sponsor-card-link">
          <img src={sponsor.logoUrl} alt={sponsor.name} className="sponsor-card-logo" />
          <span className="sponsor-card-tagline">{sponsor.tagline}</span>
        </a>
      </aside>
    );
  }
  return (
    <aside className="sponsor-card sponsor-card-empty" aria-label="Sponsor">
      <span className="sponsor-card-label">Sponsor</span>
      <p className="sponsor-card-pitch">Your brand here, in front of {context}.</p>
      <a href={contactHref} className="sponsor-card-cta">
        Sponsor LinuxStatistics
      </a>
    </aside>
  );
}
