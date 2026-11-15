import { sponsors, type Sponsor } from "../config/sponsor";

/** Supporter-tier logos in the footer. Renders nothing until someone books the tier. */
export function SupporterRow({ supporters = sponsors.supporters }: { supporters?: Sponsor[] }) {
  if (supporters.length === 0) return null;
  return (
    <section className="supporter-row" aria-label="Supported by">
      <h2>Supported by</h2>
      <ul>
        {supporters.map((s) => (
          <li key={s.href}>
            <a href={s.href} target="_blank" aria-describedby="new-tab-description" title={`${s.name} (opens in a new tab)`} rel="sponsored nofollow noopener">
              <img src={s.logoUrl} alt={s.name} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
