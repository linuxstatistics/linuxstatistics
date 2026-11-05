import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SearchItem {
  slug: string;
  name: string;
  rank: number | null;
}

/** Name/slug matches, prefix matches first, then by rank. */
export function matchDistros(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const s = query.trim().toLowerCase();
  if (!s) return [];
  return items
    .filter((d) => d.name.toLowerCase().includes(s) || d.slug.includes(s))
    .sort((a, b) => {
      const ap = a.name.toLowerCase().startsWith(s) ? 0 : 1;
      const bp = b.name.toLowerCase().startsWith(s) ? 0 : 1;
      return ap - bp || (a.rank ?? 9999) - (b.rank ?? 9999);
    })
    .slice(0, limit);
}

/**
 * Search box with a keyboard-navigable result list. `hrefFor` decides where
 * each result goes, so the same box serves "jump to" and "compare with".
 */
export function DistroSearch({
  items,
  hrefFor,
  placeholder,
  label,
  className = "jump",
  slashShortcut = false,
}: {
  items: SearchItem[];
  hrefFor: (slug: string) => string;
  placeholder: string;
  label: string;
  className?: string;
  slashShortcut?: boolean;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!slashShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slashShortcut]);

  const matches = useMemo(() => matchDistros(items, q), [q, items]);

  return (
    <div className={className}>
      <input
        ref={input}
        type="search"
        placeholder={placeholder}
        aria-label={label}
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && matches[active]) {
            e.preventDefault();
            window.location.href = hrefFor(matches[active]!.slug);
          } else if (e.key === "Escape") {
            setQ("");
          }
        }}
      />
      {slashShortcut && !q && <kbd>/</kbd>}
      {matches.length > 0 && (
        <ul id={listId} role="listbox">
          {matches.map((m, i) => (
            <li key={m.slug} role="option" aria-selected={i === active}>
              <a href={hrefFor(m.slug)} aria-selected={i === active}>
                {m.name}
                {m.rank != null && <span>#{m.rank}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
