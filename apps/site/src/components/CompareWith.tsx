import { DistroSearch, type SearchItem } from "./DistroSearch";
import { compareSlug } from "../lib/compare";

/**
 * "Compare Mint with…": search for any other distro and open the pair, using
 * the prerendered page when there is one.
 */
export function CompareWith({
  self,
  items,
  staticPairs,
}: {
  self: { slug: string; name: string };
  items: SearchItem[];
  staticPairs: string[];
}) {
  const pairs = new Set(staticPairs);
  const others = items.filter((d) => d.slug !== self.slug);
  const hrefFor = (other: string) => {
    const slug = compareSlug(self.slug, other);
    return pairs.has(slug)
      ? `/compare/${slug}/`
      : `/compare/?a=${encodeURIComponent(self.slug)}&b=${encodeURIComponent(other)}`;
  };
  return (
    <DistroSearch
      items={others}
      hrefFor={hrefFor}
      placeholder="Pick a distro…"
      label={`Compare ${self.name} with`}
      className="jump compare-with"
    />
  );
}
