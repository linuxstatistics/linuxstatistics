import { useEffect, useRef, useState } from "react";
import { BOILERPLATE, BRAND_COLOURS, PRESS_FILES, hexToRgb } from "@linux-statistics/shared";
import { copyText } from "./PressCopy";

type Item = { label: string; hint?: string; run: () => Promise<string | null> | string | null } | "sep";

const P = (f: string) => `/press/${f}`;
const download = (f: string) => {
  const a = document.createElement("a");
  a.href = P(f);
  a.download = f.split("/").pop()!;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return null;
};
const copyFile = async (f: string, what: string) => ((await copyText(null, P(f))) ? `${what} copied` : `Opened ${what}`);

const ITEMS: Item[] = [
  { label: "Copy logo as SVG", hint: "dark bg", run: () => copyFile(PRESS_FILES.logoDarkSvg, "SVG") },
  { label: "Copy light logo as SVG", hint: "light bg", run: () => copyFile(PRESS_FILES.logoLightSvg, "SVG") },
  { label: "Download logo", hint: "SVG", run: () => download(PRESS_FILES.logoDarkSvg) },
  { label: "Download logo", hint: "PNG 1200", run: () => download(PRESS_FILES.logoDarkPng) },
  { label: "Download mark", hint: "SVG", run: () => download(PRESS_FILES.markSvg) },
  "sep",
  { label: "Copy colours", hint: "hex", run: async () => ((await copyText(BRAND_COLOURS.map((c) => `${c.name} ${c.hex} rgb(${hexToRgb(c.hex)})`).join("\n"))) ? "Colours copied" : null) },
  { label: "Copy boilerplate", hint: "52 words", run: async () => ((await copyText(BOILERPLATE)) ? "Boilerplate copied" : null) },
  "sep",
  { label: "Whole press kit", hint: ".zip", run: () => download(PRESS_FILES.zip) },
  { label: "Press page", hint: "/press/", run: () => ((location.href = "/press/"), null) },
];

/**
 * Right-click (or 500 ms long-press) on the header logo opens a small menu of
 * brand assets. The footer "Press kit" link and /press/ carry the same things
 * for everyone else. Mounted once per page; attaches to `.brand`.
 */
export function PressMenu() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("a.brand");
    if (!el) return;
    triggerRef.current = el;
    el.title = "Right-click for the press kit";
    let timer: number | undefined;
    const open = (x: number, y: number) => {
      setActive(0);
      setPos({ x, y });
    };
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      open(e.clientX, e.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      timer = window.setTimeout(() => open(t.clientX, t.clientY), 500);
    };
    const cancel = () => window.clearTimeout(timer);
    el.addEventListener("contextmenu", onCtx);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", cancel);
    el.addEventListener("touchmove", cancel);
    return () => {
      el.removeEventListener("contextmenu", onCtx);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", cancel);
      el.removeEventListener("touchmove", cancel);
    };
  }, []);

  const close = () => {
    setPos(null);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!pos) return;
    const m = menuRef.current;
    if (!m) return;
    // Keep inside the viewport; flip when near the right or bottom edge.
    const r = m.getBoundingClientRect();
    const x = pos.x + r.width > window.innerWidth - 8 ? Math.max(8, pos.x - r.width) : pos.x;
    const y = pos.y + r.height > window.innerHeight - 8 ? Math.max(8, pos.y - r.height) : pos.y;
    m.style.left = `${x}px`;
    m.style.top = `${y}px`;
    m.style.transformOrigin = `${pos.x - x}px ${pos.y - y}px`;
    (m.querySelector<HTMLElement>('[role="menuitem"]') ?? m).focus();
    const onDoc = (e: MouseEvent) => {
      if (!m.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [pos]);

  const items = ITEMS.filter((i): i is Exclude<Item, "sep"> => i !== "sep");

  const run = async (item: Exclude<Item, "sep">) => {
    const msg = await item.run();
    setPos(null);
    if (msg) {
      setToast(msg);
      setTimeout(() => setToast(null), 1800);
    }
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const n = items.length;
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => (a + 1) % n));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => (a - 1 + n) % n));
    else if (e.key === "Home") (e.preventDefault(), setActive(0));
    else if (e.key === "End") (e.preventDefault(), setActive(n - 1));
    else if (e.key === "Enter" || e.key === " ") (e.preventDefault(), void run(items[active]!));
    else if (e.key === "Tab") close();
  };

  useEffect(() => {
    if (!pos) return;
    menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[active]?.focus();
  }, [active, pos]);

  let idx = -1;
  return (
    <>
      {pos && (
        <div ref={menuRef} className="press-menu" role="menu" aria-label="Press kit" onKeyDown={onMenuKey}>
          <div className="press-menu-head" aria-hidden="true">
            <svg viewBox="0 0 250 250" width="18" height="18"><circle cx="125" cy="125" r="125" fill="#000" /><path d="M72 60V190H192" fill="none" stroke="#e9eef5" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" /><rect x="100" y="132" width="22" height="40" rx="4" fill="#3cfe3f" /><rect x="133" y="106" width="22" height="66" rx="4" fill="#3cfe3f" /><rect x="166" y="74" width="22" height="98" rx="4" fill="#3cfe3f" /></svg>
            <span>Press kit</span>
          </div>
          {ITEMS.map((it, i) =>
            it === "sep" ? (
              <div key={`s${i}`} className="press-menu-sep" role="separator" />
            ) : (
              <button key={it.label + (it.hint ?? "")} type="button" role="menuitem" tabIndex={++idx === active ? 0 : -1} className="press-menu-item" onClick={() => void run(it)}>
                <span>{it.label}</span>
                {it.hint && <span className="press-menu-hint">{it.hint}</span>}
              </button>
            ),
          )}
        </div>
      )}
      {toast && (
        <div className="press-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
