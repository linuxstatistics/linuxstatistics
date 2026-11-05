import type { DistroNotes } from "../lib/distro-notes";

function List({ title, items, kind }: { title: string; items: string[]; kind: "pro" | "con" }) {
  return (
    <div className={`pc-col pc-${kind}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/** Pros and cons for one distro. Static HTML. */
export function ProsCons({ notes, heading = "Pros and cons" }: { notes: DistroNotes; heading?: string }) {
  return (
    <section className="pros-cons" aria-label={heading}>
      <h2>{heading}</h2>
      <div className="pc-grid">
        <List title="Good" items={notes.pros} kind="pro" />
        <List title="Trade-offs" items={notes.cons} kind="con" />
      </div>
    </section>
  );
}

/** Pros and cons of two distros side by side. */
export function ProsConsPair({ a, b }: { a: { name: string; notes: DistroNotes }; b: { name: string; notes: DistroNotes } }) {
  return (
    <section className="pros-cons pair" aria-label="Pros and cons">
      <h2>Pros and cons</h2>
      <div className="pc-pair">
        {[a, b].map((x) => (
          <div key={x.name}>
            <h3 className="pc-name">{x.name}</h3>
            <List title="Good" items={x.notes.pros} kind="pro" />
            <List title="Trade-offs" items={x.notes.cons} kind="con" />
          </div>
        ))}
      </div>
    </section>
  );
}
