import type { CompareLink, RelatedLink } from "../lib/related";

function DistroList({ items }: { items: RelatedLink[] }) {
  return (
    <ul>
      {items.map((d) => (
        <li key={d.slug}>
          <a href={`/distro/${d.slug}/`}>{d.name}</a>
          {d.rank != null && <span className="from">#{d.rank}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Sidebar of internal links from a distro page. Static HTML. */
export function RelatedLinks({
  compare,
  family,
  familyLabel,
  near,
}: {
  compare: CompareLink[];
  family: RelatedLink[];
  familyLabel: string;
  near: RelatedLink[];
}) {
  return (
    <>
      {compare.length > 0 && (
        <section>
          <h2>Popular comparisons</h2>
          <ul>
            {compare.map((c) => (
              <li key={c.href}>
                <a href={c.href}>{c.label}</a>
              </li>
            ))}
          </ul>
          <p>
            <a href="/compare/">All comparisons</a>
          </p>
        </section>
      )}
      {family.length > 0 && (
        <section>
          <h2>More {familyLabel} distros</h2>
          <DistroList items={family} />
        </section>
      )}
      {near.length > 0 && (
        <section>
          <h2>Nearby in the rankings</h2>
          <DistroList items={near} />
        </section>
      )}
    </>
  );
}
