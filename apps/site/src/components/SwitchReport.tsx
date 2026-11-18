import { useState } from "react";
import { DistroCombo } from "./DistroCombo";
import type { SearchItem } from "./DistroSearch";
import { useDistroList } from "../lib/use-distro-list";

export const SWITCH_FROM: [string, string][] = [
  ["windows", "Windows"],
  ["macos", "macOS"],
  ["chromeos", "ChromeOS"],
  ["linux", "Another Linux distro"],
  ["other", "Something else"],
];

type Page = "quiz" | "switch" | "getting-started" | "distro";

/**
 * "Did LinuxStatistics help you switch?" Anonymous and self-reported: where
 * the person came from and, optionally, the distro they use now. Counted
 * once per page visit; nothing is stored in the browser.
 */
export function SwitchReport({ page, distros: initial, src, nowUsing: preset, compact = false }: {
  page: Page;
  /** One-line prompt that opens into the full card (distro pages, where most readers aren't switching). */
  compact?: boolean;
  /** Distros in the HTML; with `src`, the full list loads when the box is first focused. */
  distros: SearchItem[];
  src?: string;
  nowUsing?: string;
}) {
  const [wanted, setWanted] = useState(false);
  const { items: distros } = useDistroList(initial, src, wanted);
  const [from, setFrom] = useState<string | null>(null);
  const [now, setNow] = useState(preset ?? "");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [open, setOpen] = useState(!compact);

  async function send() {
    if (!from || state !== "idle") return;
    setState("sending");
    try {
      const res = await fetch("/api/switch-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameFrom: from, nowUsing: now || undefined, page, website: "" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (!open) {
    return (
      <p className="switch-report-prompt">
        Switched to Linux recently?{" "}
        <button type="button" className="link-button" onClick={() => setOpen(true)}>
          Tell us where you came from
        </button>{" "}
        <span className="switch-report-note">(anonymous, two taps)</span>
      </p>
    );
  }

  if (state === "done") {
    return (
      <section className="switch-report" aria-live="polite">
        <p className="switch-report-done">Thanks for telling us. <a href="/stats/">See how many people we've helped</a>.</p>
      </section>
    );
  }

  return (
    <section className="switch-report" aria-labelledby={`switch-report-${page}`}>
      <h2 id={`switch-report-${page}`}>Did LinuxStatistics help you switch to Linux?</h2>
      <fieldset>
        <legend>I came from</legend>
        <div className="switch-report-chips">
          {SWITCH_FROM.map(([v, label]) => (
            <button key={v} type="button" className="chip" aria-pressed={from === v} onClick={() => setFrom(v)}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {from && (
        <div className="switch-report-now">
          <DistroCombo items={distros} value={now} onChange={setNow} onWant={() => setWanted(true)} label="Now using (optional)" placeholder="Search for your distro…" />
        </div>
      )}
      <div className="switch-report-actions">
        <button type="button" className="cta" disabled={!from || state === "sending"} onClick={send}>
          Count me in
        </button>
        <span className="switch-report-note">
          Anonymous: no account, cookie or IP stored. <a href="/privacy/#switch">Privacy</a>
        </span>
      </div>
      {state === "error" && <p role="alert">That didn't go through. Try again in a minute.</p>}
    </section>
  );
}
