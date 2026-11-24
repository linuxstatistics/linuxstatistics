import { useEffect, useId, useState } from "react";
import { Island } from "./Island";
import { CPUS, GPUS, GPU_GROUPS, RAM_OPTIONS } from "../lib/hardware-tiers";
import { check, parsePicks, picksHash, type Picks } from "../lib/miami-check";
import { MIAMI_ONLINE_NOTE, MIAMI_SOURCES, MIAMI_STORAGE_NOTE, TARGETS, type Level } from "../lib/miami-targets";
import { ANTI_CHEAT_LINKS } from "../lib/hardware-notes";

const EXT = { target: "_blank", "aria-describedby": "new-tab-description", title: "Opens in a new tab", rel: "noopener noreferrer" } as const;
const CPU_GROUPS = [...new Set(CPUS.map((c) => c.group))];
const STEPS: { level: Level; label: string }[] = [
  { level: 0, label: "Below minimum" },
  { level: 1, label: "RDR2 minimum" },
  { level: 2, label: "RDR2 recommended" },
  { level: 3, label: "PS5-class" },
];

function Meter({ level, label }: { level: Level; label: string }) {
  return (
    <span className="miami-meter" role="img" aria-label={`${label}: ${level} of 3`}>
      {[1, 2, 3].map((n) => (
        <i key={n} data-on={level >= n ? "true" : "false"} />
      ))}
    </span>
  );
}

function Checker() {
  const [picks, setPicks] = useState<Picks>({ gpu: null, cpu: null, ram: null });
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const id = useId();

  useEffect(() => setPicks(parsePicks(window.location.hash)), []);

  const update = (next: Picks) => {
    setPicks(next);
    setCopied(false);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${picksHash(next)}`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}${window.location.search}${picksHash(picks)}`);
      setCopied(true);
    } catch {
      setNote("Copy the address from your browser's bar to share this result.");
    }
  };

  const v = check(picks);

  return (
    <div className="miami-checker">
      <form className="miami-panel" onSubmit={(e) => e.preventDefault()} aria-label="Your PC">
        <div className="miami-field">
          <label htmlFor={`${id}-gpu`}>Graphics card</label>
          <select id={`${id}-gpu`} value={picks.gpu ?? ""} onChange={(e) => update({ ...picks, gpu: e.target.value || null })}>
            <option value="">Choose your graphics card</option>
            {GPU_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {GPUS.filter((x) => x.group === g).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="miami-field">
          <label htmlFor={`${id}-cpu`}>Processor</label>
          <select id={`${id}-cpu`} value={picks.cpu ?? ""} onChange={(e) => update({ ...picks, cpu: e.target.value || null })}>
            <option value="">Choose your processor</option>
            {CPU_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {CPUS.filter((x) => x.group === g).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="miami-field">
          <label htmlFor={`${id}-ram`}>Memory (RAM)</label>
          <select id={`${id}-ram`} value={picks.ram ?? ""} onChange={(e) => update({ ...picks, ram: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Choose your RAM</option>
            {RAM_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} GB</option>
            ))}
          </select>
        </div>
        <p className="miami-hint" role="status">
          {note ?? (
            <>
              Not sure what you have? On Windows, open Task Manager → Performance. On Linux, run <code>lspci | grep VGA</code> and <code>lscpu</code>. Nothing you pick leaves your browser.
            </>
          )}
        </p>
      </form>

      <div className="miami-result" aria-live="polite">
        {v ? (
          <>
            <p className="miami-verdict-kicker">Your PC against our GTA VI estimate</p>
            <h2 className="miami-verdict" data-level={v.level}>{v.label}</h2>
            <p className="miami-verdict-text">{v.summary}</p>

            <ol className="miami-ladder" aria-label="Targets, lowest to highest">
              {STEPS.map((s) => (
                <li key={s.level} data-state={s.level === v.level ? "here" : s.level < v.level ? "passed" : "ahead"}>
                  <span>{s.label}</span>
                  {s.level === v.level && <b>You</b>}
                </li>
              ))}
            </ol>

            <ul className="miami-parts">
              {v.parts.map((p) => (
                <li key={p.part}>
                  <span className="miami-part-name">{p.label}</span>
                  <Meter level={p.level} label={p.label} />
                  <span className="miami-part-detail">{p.detail}</span>
                </li>
              ))}
            </ul>

            {v.nextStep && <p className="miami-next">{v.nextStep}</p>}

            <section className="miami-linux" aria-labelledby={`${id}-linux`}>
              <h3 id={`${id}-linux`}>On Linux</h3>
              {v.linux.map((t) => <p key={t}>{t}</p>)}
              <p>{MIAMI_ONLINE_NOTE}</p>
              <p>
                See how RDR2 runs through Proton on <a href={MIAMI_SOURCES.rdr2Proton.href} {...EXT}>ProtonDB</a>, look up other games on <a href={ANTI_CHEAT_LINKS.tracker.href} {...EXT}>{ANTI_CHEAT_LINKS.tracker.name}</a>, and pick a distro in our <a href="/best/gaming/">best Linux for gaming</a> list.
              </p>
              <p>{MIAMI_STORAGE_NOTE}</p>
            </section>

            <button type="button" className="miami-link" onClick={copy}>{copied ? "Link copied" : "Copy a link to this result"}</button>
          </>
        ) : (
          <p className="miami-empty">Choose your graphics card, processor and memory to see where this PC lands against {TARGETS.map((t) => t.name).join(", ").replace(/, ([^,]*)$/, " and $1")}.</p>
        )}
      </div>
    </div>
  );
}

export function MiamiChecker() {
  return (
    <Island>
      <Checker />
    </Island>
  );
}
