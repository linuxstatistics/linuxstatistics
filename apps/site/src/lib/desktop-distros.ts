import type { DistroListItem } from "@linux-statistics/shared";
import type { DesktopPage } from "./desktops";

/** Desktop fields are optional: an API older than the site leaves them out. */
type Item = Pick<DistroListItem, "slug" | "name" | "rank"> & Partial<Pick<DistroListItem, "defaultDesktop" | "otherDesktops">>;

const byRank = (a: Item, b: Item) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name);

/** Listed distros that ship one of the page's desktops by default, and those that offer one, best ranked first. */
export function distrosFor(page: Pick<DesktopPage, "ids">, list: Item[]): { byDefault: Item[]; offered: Item[] } {
  const ids = new Set<string>(page.ids);
  const byDefault = list.filter((d) => d.defaultDesktop != null && ids.has(d.defaultDesktop)).sort(byRank);
  const taken = new Set(byDefault.map((d) => d.slug));
  const offered = list.filter((d) => !taken.has(d.slug) && (d.otherDesktops ?? []).some((x) => ids.has(x))).sort(byRank);
  return { byDefault, offered };
}
