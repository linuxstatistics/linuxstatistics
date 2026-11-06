import { useEffect, useState } from "react";
import type { Use } from "../lib/picker-profiles";
import { isUse, VERDICT_TEXT, type UseFit } from "../lib/use-fit";

/**
 * "How it fits what you do": one tab per use. Opens on ?for=<use> (set by the
 * quiz) so someone who asked about AI lands on the AI pros and cons. Rendered
 * on the server with the first tab open; all panels are in the HTML.
 */
export function UseFitTabs({ name, fits }: { name: string; fits: UseFit[] }) {
  const [active, setActive] = useState<Use>(fits[0]!.use);

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("for");
    if (isUse(f)) setActive(f);
  }, []);

  function pick(use: Use) {
    setActive(use);
    const url = new URL(window.location.href);
    url.searchParams.set("for", use);
    window.history.replaceState(null, "", url);
  }

  function onKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = fits[(i + (e.key === "ArrowRight" ? 1 : fits.length - 1)) % fits.length]!;
    pick(next.use);
    document.getElementById(`fit-tab-${next.use}`)?.focus();
  }

  return (
    <section className="use-fit" aria-labelledby="use-fit-h">
      <h2 id="use-fit-h">How {name} fits what you do</h2>
      <div className="use-fit-tabs" role="tablist" aria-label="Uses">
        {fits.map((f, i) => (
          <button
            key={f.use}
            id={`fit-tab-${f.use}`}
            type="button"
            role="tab"
            aria-selected={active === f.use}
            aria-controls={`fit-panel-${f.use}`}
            tabIndex={active === f.use ? 0 : -1}
            className={`use-fit-tab v-${f.verdict}`}
            onClick={() => pick(f.use)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {fits.map((f) => (
        <div key={f.use} id={`fit-panel-${f.use}`} role="tabpanel" aria-labelledby={`fit-tab-${f.use}`} hidden={active !== f.use} className="use-fit-panel">
          <p className={`use-fit-verdict v-${f.verdict}`}>
            {f.label}: <strong>{VERDICT_TEXT[f.verdict]}</strong>
          </p>
          <div className="pc-grid">
            <div className="pc-col pc-pro">
              <h3>Good</h3>
              {f.pros.length ? <ul>{f.pros.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="note">Nothing that stands out for this.</p>}
            </div>
            <div className="pc-col pc-con">
              <h3>Trade-offs</h3>
              {f.cons.length ? <ul>{f.cons.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="note">None we know of.</p>}
            </div>
          </div>
        </div>
      ))}
      <p className="note use-fit-note">
        From our hand-written profile of {name}. <a href={`/pick/`}>Take the quiz</a> to compare it with other distros for your setup.
      </p>
    </section>
  );
}
