import { sponsors as configured, type Sponsor } from "../config/sponsor";
import { SponsorCard } from "./SponsorCard";

/**
 * Sidebar sponsors on install-intent pages (quiz, Switch, Getting started):
 * the headline card (or the house ad), then the guide card when one is booked.
 * A company holding both tiers appears once, with its guide card.
 */
export function SponsorStack({
  headline = configured.headline,
  guide = configured.guide,
  context,
}: {
  headline?: Sponsor | null;
  guide?: Sponsor | null;
  context?: string;
}) {
  if (guide && headline && guide.href === headline.href) return <SponsorCard sponsor={guide} context={context} />;
  return (
    <>
      <SponsorCard sponsor={headline} context={context} />
      {guide && <SponsorCard sponsor={guide} context={context} />}
    </>
  );
}
