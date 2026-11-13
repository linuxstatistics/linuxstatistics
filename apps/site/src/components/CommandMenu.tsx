import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SearchItem } from "./DistroSearch";
import { searchCommands, type Command } from "../lib/command-menu";

const KIND_LABEL: Record<Command["kind"], string> = { page: "Page", distro: "Distro", compare: "Compare", action: "Action" };

function run(cmd: Command) {
  if (cmd.kind === "action") {
    document.getElementById("theme-toggle")?.click();
    return;
  }
  window.location.href = cmd.href;
}

/**
 * Cmd+K / Ctrl+K menu: jump to a distro, a page, a comparison ("mint vs fedora")
 * or switch theme. On narrow screens a search button in the header opens it.
 */
export function CommandMenu({ items, staticPairs = [] }: { items: SearchItem[]; staticPairs?: string[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const pairs = useMemo(() => new Set(staticPairs), [staticPairs]);
  const results = useMemo(() => searchCommands(q, items, pairs), [q, items, pairs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
      input.current?.focus();
    } else if (!open && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    if (!open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const choose = (cmd: Command) => {
    setOpen(false);
    run(cmd);
  };

  return (
    <>
      <button type="button" className="cmdk-trigger" aria-label="Search the site" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
      </button>
      <dialog
        ref={dialog}
        className="cmdk"
        aria-label="Search the site"
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        {open && (
          <div className="cmdk-panel">
            <input
              ref={input}
              type="search"
              className="cmdk-input"
              placeholder="Distro, page, or “mint vs fedora”"
              aria-label="Search distros, pages and comparisons"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && results[active]) {
                  e.preventDefault();
                  choose(results[active]!);
                } else if (e.key === "Escape") {
                  // A search input would clear itself first; close in one press instead.
                  e.preventDefault();
                  setOpen(false);
                }
              }}
            />
            {results.length > 0 ? (
              <ul id={listId} role="listbox" className="cmdk-list" aria-label="Results">
                {results.map((r, i) => (
                  <li
                    key={r.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(r)}
                  >
                    <span className="cmdk-label">{r.label}</span>
                    <span className="cmdk-kind">{r.kind === "distro" && r.rank != null ? `#${r.rank}` : KIND_LABEL[r.kind]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cmdk-empty">Nothing matches “{q}”. <a href={`/suggest/?kind=distro`}>Suggest a distro</a></p>
            )}
            <p className="cmdk-help" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> move <kbd>↵</kbd> open <kbd>esc</kbd> close</p>
          </div>
        )}
      </dialog>
    </>
  );
}
