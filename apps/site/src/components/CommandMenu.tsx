import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SearchItem } from "./DistroSearch";
import { GROUP_LABEL, groupCommands, searchCommands, type Command } from "../lib/command-menu";

/**
 * Keep the page still behind the open menu, so a swipe scrolls the menu list.
 * The body is pinned at its current offset and put back on close, so the page
 * doesn't jump to the top (plain overflow: hidden does that on iOS).
 */
let lockedY: number | null = null;
function lockScroll() {
  if (lockedY !== null) return;
  lockedY = window.scrollY;
  const b = document.body.style;
  b.position = "fixed";
  b.top = `-${lockedY}px`;
  b.left = "0";
  b.right = "0";
  document.documentElement.classList.add("cmdk-open");
}
function unlockScroll() {
  if (lockedY === null) return;
  const y = lockedY;
  lockedY = null;
  const b = document.body.style;
  b.position = b.top = b.left = b.right = "";
  document.documentElement.classList.remove("cmdk-open");
  window.scrollTo({ top: y, behavior: "instant" });
}

function run(cmd: Command) {
  if (cmd.kind === "action") {
    window.dispatchEvent(new Event("cycle-theme"));
    return;
  }
  if (cmd.kind === "link") {
    window.open(cmd.href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.href = cmd.href;
}

/**
 * The site's menu and search in one: pages, distros, comparisons ("mint vs fedora"),
 * theme and the site's accounts. Opened from the header button, Cmd/Ctrl+K or "/".
 */
export function CommandMenu({ items, staticPairs = [], current }: { items: SearchItem[]; staticPairs?: string[]; current?: string }) {
  const [open, setOpen] = useState(false);
  // Keyboard opens (Cmd/Ctrl+K, "/") focus the search box; a tap on a touch screen
  // doesn't, so the on-screen keyboard stays down until the person taps the box.
  const focusOnOpen = useRef(true);
  const lastPointer = useRef("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [mac, setMac] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const pairs = useMemo(() => new Set(staticPairs), [staticPairs]);
  const groups = useMemo(() => groupCommands(searchCommands(q, items, pairs)), [q, items, pairs]);
  // Flattened in display order, so arrow keys follow what the eye sees.
  const results = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focusOnOpen.current = true;
        setOpen((o) => !o);
        return;
      }
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        focusOnOpen.current = true;
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      // Lock before showModal and focus: both can scroll the page, and the lock records where it was.
      lockScroll();
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
      if (focusOnOpen.current) input.current?.focus({ preventScroll: true });
      else (d.querySelector(".cmdk-panel") as HTMLElement | null)?.focus({ preventScroll: true });
    } else if (!open && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    if (!open) unlockScroll();
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
      <button type="button" className="cmdk-trigger" aria-label="Menu and search" aria-haspopup="dialog" aria-expanded={open} aria-keyshortcuts={mac ? "Meta+K" : "Control+K"} onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
        onClick={() => {
          // Mouse or keyboard: focus the box. Touch or pen: leave the keyboard down.
          focusOnOpen.current = !(lastPointer.current === "touch" || lastPointer.current === "pen");
          lastPointer.current = "";
          setOpen(true);
        }}>
        <svg className="cmdk-icon-search" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
        <svg className="cmdk-icon-menu" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        <span className="cmdk-trigger-label">Menu and search</span>
        <span className="cmdk-trigger-short" aria-hidden="true">Menu</span>
        <kbd className="cmdk-trigger-kbd" aria-hidden="true">{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <dialog
        ref={dialog}
        className="cmdk"
        aria-label="Menu and search"
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        {open && (
          <div className="cmdk-panel" tabIndex={-1}>
            <input
              ref={input}
              type="search"
              className="cmdk-input"
              placeholder="Search distros, pages, or “mint vs fedora”"
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
              <div id={listId} role="listbox" className="cmdk-list" aria-label="Results">
                {groups.map((g) => {
                  const headingId = `${listId}-${g.kind}`;
                  return (
                    <div key={g.kind} role="group" aria-labelledby={headingId} className="cmdk-group">
                      <div id={headingId} className="cmdk-group-title" role="presentation">{GROUP_LABEL[g.kind]}</div>
                      {g.items.map((r) => {
                        const i = results.indexOf(r);
                        return (
                          <div
                            key={r.id}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            className="cmdk-item"
                            onMouseMove={() => setActive(i)}
                            onClick={() => choose(r)}
                          >
                            <span className="cmdk-label">{r.label}</span>
                            {r.kind === "distro" && r.rank != null && <span className="cmdk-kind">#{r.rank}</span>}
                            {r.kind === "page" && r.href === current && <span className="cmdk-kind">You're here</span>}
                            {r.kind === "link" && <span className="cmdk-kind">{r.hint} ↗</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
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
