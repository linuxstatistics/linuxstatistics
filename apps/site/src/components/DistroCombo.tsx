import { useEffect, useId, useMemo, useRef, useState } from "react";
import { matchDistros, type SearchItem } from "./DistroSearch";

/**
 * Searchable distro picker: type to filter, arrows + Enter or click to choose.
 * With an empty query it lists the top-ranked distros so it also works as a
 * plain dropdown.
 */
export function DistroCombo({
  items,
  value,
  onChange,
  label,
  placeholder = "Search for a distro…",
}: {
  items: SearchItem[];
  value: string;
  onChange: (slug: string) => void;
  label: string;
  placeholder?: string;
}) {
  const selected = items.find((d) => d.slug === value) ?? null;
  const [q, setQ] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);

  // Keep the text in step when the value changes from outside (URL prefill).
  useEffect(() => {
    setQ(selected?.name ?? "");
  }, [selected?.name]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  });

  const typed = q.trim() !== "" && q !== selected?.name;
  const matches = useMemo(
    () =>
      typed
        ? matchDistros(items, q, 10)
        : [...items].filter((d) => d.rank != null).sort((a, b) => a.rank! - b.rank!).slice(0, 10),
    [items, q, typed],
  );

  function choose(d: SearchItem) {
    onChange(d.slug);
    setQ(d.name);
    setOpen(false);
  }
  function close() {
    setOpen(false);
    setQ(selected?.name ?? "");
  }

  return (
    <div className="combo" ref={root}>
      <input
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        onFocus={(e) => {
          e.currentTarget.select();
          setOpen(true);
          setActive(0);
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            choose(matches[active]!);
          } else if (e.key === "Escape" || e.key === "Tab") {
            close();
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" aria-label={label}>
          {!typed && <li className="combo-hint" aria-hidden="true">Top distros. Type to search all.</li>}
          {matches.map((m, i) => (
            <li
              key={m.slug}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(m);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {m.name}
              {m.rank != null && <span>#{m.rank}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
