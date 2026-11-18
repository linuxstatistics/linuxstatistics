import { useEffect, useState } from "react";
import { loadDistroList } from "./distro-list";

/**
 * The full distro list for an island: `initial` (rendered in the HTML) until the
 * list at `src` has loaded, then the list. No `src` keeps `initial`. Loading
 * starts once `enabled` is true. T must be a subset of the list row fields.
 */
export function useDistroList<T>(initial: T[], src?: string, enabled = true): { items: T[]; loaded: boolean } {
  const [items, setItems] = useState<T[] | null>(null);
  useEffect(() => {
    if (!src || !enabled || items) return;
    let live = true;
    loadDistroList(src)
      .then((rows) => {
        if (live) setItems(rows as unknown as T[]);
      })
      // Keep what the page rendered; the island still works on that.
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [src, enabled, items]);
  return { items: items ?? initial, loaded: items !== null };
}
