import type { QA } from "../lib/faq";

/** Questions and answers, open by default so they're readable without JS. Pass open={false} to start them collapsed. */
export function Faq({ items, open = true }: { items: QA[]; open?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="faq" aria-labelledby="faq-h">
      <h2 id="faq-h">Questions</h2>
      {items.map((x) => (
        <details key={x.q} open={open}>
          <summary>{x.q}</summary>
          <p>{x.a}</p>
        </details>
      ))}
    </section>
  );
}
