import { capitalize } from "../lib/verdict";
import { REFERENCE_KIND_LABEL, type ReferenceProfile } from "../lib/reference-profiles";

/**
 * "Who it's for" card for a ranked system that isn't a general desktop distro
 * (BSDs, ChromeOS, servers, NAS, phones). Takes the place of the "Pick X if"
 * card on its distro page.
 */
export function ReferenceCard({ name, profile: p, insteadName }: { name: string; profile: ReferenceProfile; insteadName?: string }) {
  return (
    <section className="dsec reference-card" aria-labelledby="ref-h">
      <p className="reference-kind">
        {REFERENCE_KIND_LABEL[p.kind]}
        {p.notLinux && " · not Linux"}
      </p>
      <div className="verdict single">
        <div className="verdict-card">
          <span className="verdict-label" id="ref-h">Good for you if:</span>
          <ul className="verdict-reasons">
            {p.goodFor.map((g) => (
              <li key={g}>{capitalize(g)}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="reference-not-for">
        <span>Before you choose it:</span> {p.notFor}
      </p>
      {p.instead && insteadName && (
        <p className="reference-instead">
          Want a regular desktop instead? <a href={`/distro/${p.instead.slug}/`}>{insteadName}</a>: {p.instead.why}.
        </p>
      )}
      <p className="source-note">
        LinuxStatistics summary of <a href={p.source} target="_blank" aria-describedby="new-tab-description" title="Opens in a new tab" rel="noopener noreferrer">{name}'s own site</a>. Not part of the distro quiz.
      </p>
    </section>
  );
}
