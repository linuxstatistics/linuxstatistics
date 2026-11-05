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

/** Shown where pros and cons would go when we haven't written them yet. */
export function NotEnoughData({ name, what = "pros and cons" }: { name: string; what?: string }) {
  return (
    <div className="no-data" role="note">
      <span className="no-data-label">Not enough data</span>
      <p>
        We haven't written {what} for {name} yet. <a href={`/suggest/?kind=correction&subject=${encodeURIComponent(`${name}: ${what}`)}`}>Suggest some</a>.
      </p>
    </div>
  );
}

/** Pros and cons of two distros side by side; a placeholder for a side without notes. */
export function ProsConsPair({ a, b }: { a: { name: string; notes: DistroNotes | null }; b: { name: string; notes: DistroNotes | null } }) {
  return (
    <section className="pros-cons pair" aria-label="Pros and cons">
      <h2>Pros and cons</h2>
      <div className="pc-pair">
        {[a, b].map((x) => (
          <div key={x.name}>
            <h3 className="pc-name">{x.name}</h3>
            {x.notes ? (
              <>
                <List title="Good" items={x.notes.pros} kind="pro" />
                <List title="Trade-offs" items={x.notes.cons} kind="con" />
              </>
            ) : (
              <NotEnoughData name={x.name} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
