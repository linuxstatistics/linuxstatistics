import { useState } from "react";

/** Copies `text` (or the body of `url`) to the clipboard; opens the URL if the clipboard is blocked. */
export async function copyText(text: string | null, url?: string): Promise<boolean> {
  try {
    const value = text ?? (url ? await (await fetch(url)).text() : "");
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    return true;
  } catch {
    if (url) window.open(url, "_blank", "noopener");
    return false;
  }
}

/** Small "Copy" button used on the press page. */
export function PressCopy({ text, url, label = "Copy" }: { text?: string; url?: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className="crypto-copy"
      onClick={async () => {
        const ok = await copyText(text ?? null, url);
        setState(ok ? "done" : "fail");
        setTimeout(() => setState("idle"), 1600);
      }}
    >
      {state === "done" ? "Copied" : state === "fail" ? "Opened" : label}
    </button>
  );
}
