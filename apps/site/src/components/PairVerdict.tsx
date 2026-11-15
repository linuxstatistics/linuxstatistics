import { capitalize, type PairVerdict as Verdict } from "../lib/verdict";

/** Reasons as a list, each starting with a capital ("You're new to Linux"). */
function Reasons({ items }: { items: string[] }) {
  return (
    <ul className="verdict-reasons">
      {items.map((r) => (
        <li key={r}>{capitalize(r)}</li>
      ))}
    </ul>
  );
}

/** "Pick X if… / Pick Y if…" block at the top of a pair page. */
export interface NextSteps {
  href: string;
  guide?: string;
  /** For cards with nothing to recommend: what we do know. */
  summary?: string;
  website?: string;
  repo?: string;
  slug?: string;
}

function Next({ name, to }: { name: string; to?: NextSteps }) {
  if (!to) return null;
  return (
    <p className="verdict-next">
      <a href={to.href}>{name} in detail</a>
      {to.guide && <a href={to.guide}>Getting started with {name}</a>}
    </p>
  );
}

export function PairVerdict({ v, links }: { v: Verdict; links?: { a: NextSteps; b: NextSteps } }) {
  return (
    <section className="verdict" aria-label="Which to pick">
      {[v.a, v.b].map((side, i) =>
        side.reasons.length > 0 ? (
          <div key={side.name} className="verdict-card">
            <span className="verdict-label">Pick {side.name} if:</span>
            <Reasons items={side.reasons} />
            <Next name={side.name} to={links?.[i === 0 ? "a" : "b"]} />
          </div>
        ) : side.empty === "same" ? (
          <div key={side.name} className="verdict-card">
            <span className="verdict-label">{side.name} suits the same people</span>
            <p>{side.blurb}</p>
            <Next name={side.name} to={links?.[i === 0 ? "a" : "b"]} />
          </div>
        ) : (
          <UnknownCard key={side.name} name={side.name} to={links?.[i === 0 ? "a" : "b"]} />
        ),
      )}
    </section>
  );
}

/** "Good for" line on a distro page. */
export function WhoItSuits({ name, reasons }: { name: string; reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <section className="verdict single" aria-label="Who it suits">
      <div className="verdict-card">
        <span className="verdict-label">Pick {name} if:</span>
        <Reasons items={reasons} />
      </div>
    </section>
  );
}

/** A side we can't recommend for anyone yet: say so, then show what we do know and where to look. */
function UnknownCard({ name, to }: { name: string; to?: NextSteps }) {
  return (
    <div className="verdict-card no-data">
      <span className="no-data-label">About {name}</span>
      {to?.summary ? <p>{to.summary}</p> : <p>We haven't profiled {name} yet, so we can't say who it suits.</p>}
      {to && (
        <p className="verdict-next">
          <a href={to.href}>{name} in detail</a>
          {to.website && <a href={to.website} target="_blank" aria-describedby="new-tab-description" title="Opens in a new tab" rel="noopener noreferrer">Website</a>}
          {to.repo && <a href={`https://github.com/${to.repo}`} target="_blank" aria-describedby="new-tab-description" title="Opens in a new tab" rel="noopener noreferrer">GitHub</a>}
          {to.slug && <a href={`/suggest/?kind=correction&subject=${to.slug}`}>Know {name}? Tell us who it suits</a>}
        </p>
      )}
    </div>
  );
}
