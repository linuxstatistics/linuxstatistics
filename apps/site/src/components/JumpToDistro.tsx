import { useEffect, useMemo, useRef, useState } from "react";

export interface JumpItem {
  slug: string;
  name: string;
  rank: number | null;
}

/** Client-side "jump to a distro" box. Press "/" to focus. */
export function JumpToDistro({ items }: { items: JumpItem[] }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return items
      .filter((d) => d.name.toLowerCase().includes(s) || d.slug.includes(s))
      .sort((a, b) => {
        const ap = a.name.toLowerCase().startsWith(s) ? 0 : 1;
        const bp = b.name.toLowerCase().startsWith(s) ? 0 : 1;
        return ap - bp || (a.rank ?? 9999) - (b.rank ?? 9999);
      })
      .slice(0, 8);
  }, [q, items]);

  const go = (slug: string) => {
    window.location.href = `/distro/${slug}/`;
  };

  return (
    <div className="jump">
      <input
        ref={input}
        type="search"
        placeholder="Jump to a distro"
        aria-label="Jump to a distro"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls="jump-list"
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
            go(matches[active]!.slug);
          } else if (e.key === "Escape") {
            setQ("");
          }
        }}
      />
      {!q && <kbd>/</kbd>}
      {matches.length > 0 && (
        <ul id="jump-list" role="listbox">
          {matches.map((m, i) => (
            <li key={m.slug} role="option" aria-selected={i === active}>
              <a href={`/distro/${m.slug}/`} aria-selected={i === active}>
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
