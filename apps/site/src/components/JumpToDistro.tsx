import { DistroSearch, type SearchItem } from "./DistroSearch";

export type JumpItem = SearchItem;

/** Header "jump to a distro" box. Press "/" to focus. */
export function JumpToDistro({ items }: { items: JumpItem[] }) {
  return (
    <DistroSearch
      items={items}
      hrefFor={(slug) => `/distro/${slug}/`}
      placeholder="Jump to a distro"
      label="Jump to a distro"
      slashShortcut
    />
  );
}
