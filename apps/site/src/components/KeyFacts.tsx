import type { KeyFact } from "../lib/facts";

function FactList({ facts }: { facts: KeyFact[] }) {
  return (
    <ul>
      {facts.map((f) => (
        <li key={f.text}>
          {f.text} <span className="key-fact-source">Source: {f.source}</span>
        </li>
      ))}
    </ul>
  );
}

/** Quotable facts with their sources. Static HTML, no client JS. */
export function KeyFacts({ title, facts }: { title: string; facts: KeyFact[] }) {
  if (facts.length === 0) return null;
  return (
    <section className="key-facts" aria-label={title}>
      <h2>{title}</h2>
      <FactList facts={facts} />
    </section>
  );
}

/** Two distros side by side on a compare page; a side with no facts is left out. */
export function KeyFactsPair({ sides }: { sides: { name: string; facts: KeyFact[] }[] }) {
  const shown = sides.filter((s) => s.facts.length > 0);
  if (shown.length === 0) return null;
  return (
    <section className="key-facts key-facts-pair" aria-label="Key facts">
      <h2>Key facts</h2>
      {shown.map((s) => (
        <div key={s.name}>
          <h3>{s.name}</h3>
          <FactList facts={s.facts} />
        </div>
      ))}
    </section>
  );
}
