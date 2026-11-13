import { useEffect, useRef, useState } from "react";
import { DistroPicker, type PickerDistro } from "./DistroPicker";
import { beginnerFlow, beginnerHint, beginnerOptions, beginnerQuery, beginnerRecommendation, parseBeginner, pickerMode, pruneBeginner, type BeginnerAnswers } from "../lib/beginner-picker";
import { PROFILES } from "../lib/picker-profiles";

/** Short flow is independent of the detailed quiz's append-only share codes. */
export function BeginnerPicker({ distros, staticPairs }: { distros: PickerDistro[]; staticPairs: string[] }) {
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");
  const [answers, setAnswers] = useState<BeginnerAnswers>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(location.search);
      setMode(pickerMode(params));
      const a = parseBeginner(params);
      setAnswers(a);
      const next = beginnerFlow(a).findIndex((q) => !a[q.id]);
      const saved = history.state?.beginnerStep;
      const restoredStep = Number.isInteger(saved) && saved >= 0 ? Math.min(saved, beginnerFlow(a).length - 1) : next === -1 ? 0 : next;
      setDone(history.state?.beginnerDone ?? next === -1);
      setStep(restoredStep);
      if (!history.state?.beginnerStep && !params.has("a") && params.get("mode") !== "advanced") {
        history.replaceState({ beginnerStep: restoredStep, beginnerDone: next === -1 }, "", location.href);
      }
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => { if (interacted.current) heading.current?.focus(); }, [step, done]);
  const questions = beginnerFlow(answers);
  const q = questions[Math.min(step, questions.length - 1)]!;
  const tracked = new Set(distros.map((d) => d.slug));
  const result = beginnerRecommendation(answers, tracked);
  const hint = beginnerHint(q, answers);
  const navigate = (next: number, complete = false, nextAnswers = answers) => {
    interacted.current = true;
    setError(false);
    setStep(next);
    setDone(complete);
    history.pushState({ beginnerStep: next, beginnerDone: complete }, "", `/pick/?${beginnerQuery(nextAnswers)}`);
  };
  if (mode === "advanced") return <DistroPicker distros={distros} staticPairs={staticPairs} />;
  const profile = result.kind === "recommendation" ? PROFILES.find((p) => p.key === result.slug) : undefined;
  const name = result.kind === "recommendation" ? distros.find((d) => d.slug === result.slug)?.name : undefined;
  return (
    <div className="beginner-picker">
      {!done ? (
        <form onSubmit={(event) => { event.preventDefault(); if (!answers[q.id]) { setError(true); return; } navigate(step + 1, step >= questions.length - 1); }}>
          <p className="beginner-progress">{step < 3 ? `Core question ${step + 1} of 3` : "One useful follow-up"}</p>
          <h2 ref={heading} tabIndex={-1}>{q.title}</h2>
          {hint && <p className="tip"><span>{hint.split("`").map((part, i) => i % 2 ? <code key={i}>{part}</code> : part)}</span></p>}
          <p className="beginner-hint">Click or tap an answer to continue. With a keyboard, select an answer, then use Continue.</p>
          <fieldset aria-describedby={error ? "beginner-error" : undefined}>
            <legend className="visually-hidden">{q.title}</legend>
            {beginnerOptions(q).map(([value, label]) => (
              <label className="beginner-option" key={value} onClick={(event) => {
                // Keyboard radio navigation selects without unexpectedly changing the screen.
                if (event.detail === 0) return;
                event.preventDefault();
                const next = pruneBeginner({ ...answers, [q.id]: value });
                setAnswers(next);
                navigate(step + 1, step >= beginnerFlow(next).length - 1, next);
              }}>
                <input type="radio" name={q.id} value={value} checked={answers[q.id] === value} onChange={() => { setAnswers(pruneBeginner({ ...answers, [q.id]: value })); setError(false); }} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          {error && <p id="beginner-error" role="alert">Choose an answer. “Not sure” is fine.</p>}
          <div className="beginner-actions">
            {step > 0 && <button type="button" className="beginner-back" onClick={() => navigate(step - 1)}><span className="icon-arrow icon-arrow-left" aria-hidden="true" /> Back</button>}
            <button className="cta" type="submit">{step === questions.length - 1 ? "See my starting point" : "Continue"}</button>
          </div>
        </form>
      ) : (
        <section aria-label="Your starting point">
          <h2 ref={heading} tabIndex={-1}>{result.kind === "recommendation" ? `A good place to start: ${name}` : result.title}</h2>
          {profile && <p>{profile.blurb}</p>}
          {result.kind === "recommendation" && <ul className="beginner-reasons">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          <p className="beginner-caveat">{result.caveat}</p>
          <div className="beginner-actions">
            <a className="cta" href={result.kind === "recommendation" ? `/switch/getting-started/?distro=${result.slug}` : result.href} target={result.kind === "compatibility-check" && result.href.startsWith("https:") ? "_blank" : undefined} rel={result.kind === "compatibility-check" && result.href.startsWith("https:") ? "noopener noreferrer" : undefined} {...(result.kind === "compatibility-check" && result.href.startsWith("https:") ? { "aria-describedby": "new-tab-description", title: "Opens in a new tab" } : {})}>{result.kind === "recommendation" ? `Getting started with ${name}` : "Check compatibility"}</a>
            {profile && <a href={profile.downloadUrl} target="_blank" aria-describedby="new-tab-description" title="Opens in a new tab" rel="noopener noreferrer">Official download</a>}
          </div>
          {result.kind === "recommendation" && result.alternatives.length > 0 && <div className="beginner-alternatives"><h3>Other options, if you need them</h3>{result.alternatives.map((a) => <p key={a.slug}><a href={`/distro/${a.slug}/`}>{distros.find((d) => d.slug === a.slug)?.name}</a>: {a.reason}</p>)}</div>}
          <button type="button" className="chip" onClick={() => navigate(0)}>Edit answers</button>
        </section>
      )}
      <a className="beginner-advanced" href="/pick/?mode=advanced">
        <span className="beginner-advanced-text">
          <span className="beginner-advanced-title">Advanced quiz</span>
          <span className="beginner-advanced-sub">Already know your preferences? Choose desktop, updates, package manager and more.</span>
        </span>
        <span className="beginner-advanced-arrow" aria-hidden="true"><span className="icon-arrow" /></span>
      </a>
    </div>
  );
}
