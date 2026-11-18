import { useEffect, useState } from "react";
import type { Use } from "../lib/picker-profiles";
import { isUse, VERDICT_TEXT, type UseFit } from "../lib/use-fit";
import type { DistroNotes } from "../lib/distro-notes";

type TabId = Use | "overall";

/**
 * "Good and trade-offs": an Overall tab with the hand-written pros and cons
 * (`overall`), then a tab for each use the distro is built for (`primary`),
 * plus the use from ?for=<use> when the quiz sent someone here for something
 * else. Rendered on the server with the first tab open.
 */
export function UseFitTabs({ name, fits: all, primary, overall }: { name: string; fits: UseFit[]; primary?: Use[]; overall?: DistroNotes | null }) {
  const [extra, setExtra] = useState<Use | null>(null);
  const shown = new Set<Use>([...(primary ?? all.map((f) => f.use)), ...(extra ? [extra] : [])]);
  const fits = all.filter((f) => shown.has(f.use));
  const tabs: { id: TabId; label: string; verdict?: UseFit["verdict"] }[] = [
    ...(overall ? [{ id: "overall" as const, label: "Overall" }] : []),
    ...fits.map((f) => ({ id: f.use, label: f.label, verdict: f.verdict })),
  ];
  const [active, setActive] = useState<TabId>(tabs[0]!.id);

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("for");
    if (!isUse(f) || !all.some((x) => x.use === f)) return;
    setExtra(f);
    setActive(f);
  }, [all]);

  function pick(id: TabId) {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === "overall") url.searchParams.delete("for");
    else url.searchParams.set("for", id);
    window.history.replaceState(null, "", url);
  }

  function onKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
    pick(next.id);
    document.getElementById(`fit-tab-${next.id}`)?.focus();
  }

  return (
    <section className="use-fit" aria-labelledby="use-fit-h">
      <h2 id="use-fit-h">{name}: good and trade-offs</h2>
      <div className="use-fit-tabs" role="tablist" aria-label="Overall or by use">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`fit-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`fit-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className={`use-fit-tab${t.verdict ? ` v-${t.verdict}` : " overall"}`}
            onClick={() => pick(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {overall && (
        <div id="fit-panel-overall" role="tabpanel" aria-labelledby="fit-tab-overall" hidden={active !== "overall"} className="use-fit-panel">
          <Columns pros={overall.pros} cons={overall.cons} />
        </div>
      )}
      {fits.map((f) => (
        <div key={f.use} id={`fit-panel-${f.use}`} role="tabpanel" aria-labelledby={`fit-tab-${f.use}`} hidden={active !== f.use} className="use-fit-panel">
          <p className={`use-fit-verdict v-${f.verdict}`}>
            {f.label}: <strong>{VERDICT_TEXT[f.verdict]}</strong>
          </p>
          <Columns pros={f.pros} cons={f.cons} />
        </div>
      ))}
      <p className="note use-fit-note">
        {overall ? "Overall: our hand-written notes. By use: from our profile" : "From our hand-written profile"} of {name}. <a href={`/pick/`}>Take the quiz</a> to compare it with other distros for your setup.
      </p>
    </section>
  );
}

function Columns({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="pc-grid">
      <div className="pc-col pc-pro">
        <h3>Good</h3>
        {pros.length ? <ul>{pros.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="note">Nothing that stands out for this.</p>}
      </div>
      <div className="pc-col pc-con">
        <h3>Trade-offs</h3>
        {cons.length ? <ul>{cons.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="note">None we know of.</p>}
      </div>
    </div>
  );
}
