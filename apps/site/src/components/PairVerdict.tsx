import { orList, type PairVerdict as Verdict } from "../lib/verdict";

/** "Pick X if… / Pick Y if…" block at the top of a pair page. */
export function PairVerdict({ v }: { v: Verdict }) {
  return (
    <section className="verdict" aria-label="Which to pick">
      {[v.a, v.b].map((side) =>
        side.reasons.length > 0 ? (
          <div key={side.name} className="verdict-card">
            <span className="verdict-label">Pick {side.name} if</span>
            <p>{orList(side.reasons)}.</p>
          </div>
        ) : side.empty === "same" ? (
          <div key={side.name} className="verdict-card">
            <span className="verdict-label">{side.name} suits the same people</span>
            <p>{side.blurb}</p>
          </div>
        ) : (
          <div key={side.name} className="verdict-card no-data">
            <span className="no-data-label">Pick {side.name} if</span>
            <p>Not enough data to say who {side.name} suits. Compare the numbers below.</p>
          </div>
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
        <span className="verdict-label">Pick {name} if</span>
        <p>{orList(reasons)}.</p>
      </div>
    </section>
  );
}
