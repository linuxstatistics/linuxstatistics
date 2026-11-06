import { useEffect, useMemo, useRef, useState } from "react";
import { rankAll, type Suggestion } from "../lib/picker";
import { PROFILES, type PickerProfile } from "../lib/picker-profiles";
import { decodeAnswers, encodeAnswers, flow, prune, type Answers, type Question } from "../lib/picker-questions";
import { TELEMETRY_LABEL, telemetryFor } from "../lib/telemetry";
import { compareSlug } from "../lib/compare";

export interface PickerDistro {
  slug: string;
  name: string;
  rank: number | null;
  /** Places gained over about a year (positive = up). */
  rankTrend?: number | null;
}

type Fit = "idle" | "sending" | "done";

/**
 * "Which distro should I use?" quiz: one question per screen, every question
 * skippable, later questions depend on earlier answers. Runs in the browser;
 * answers live only in the URL (?a=) so results can be shared. The optional
 * "did this fit?" vote is anonymous.
 */
export function DistroPicker({ distros, staticPairs = [], initialCode }: { distros: PickerDistro[]; staticPairs?: string[]; initialCode?: string }) {
  const bySlug = useMemo(() => new Map(distros.map((d) => [d.slug, d])), [distros]);
  const profiles = useMemo(() => PROFILES.filter((p) => bySlug.has(p.key)), [bySlug]);
  const profileOf = useMemo(() => new Map(PROFILES.map((p) => [p.key, p])), []);

  const [answers, setAnswers] = useState<Answers>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [why, setWhy] = useState(false);
  const [fit, setFit] = useState<Fit>("idle");
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore from a shared link.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("a") ?? initialCode;
    if (code == null) return;
    const a = decodeAnswers(code);
    setAnswers(a);
    setSkipped(new Set(flow(a).filter((q) => a[q.id] === undefined).map((q) => q.id)));
    setDone(true);
  }, [initialCode]);

  const questions = flow(answers);
  const q: Question | undefined = questions[step];
  const code = encodeAnswers(answers);
  const forUse = answers.use ? `?for=${answers.use}` : "";

  useEffect(() => {
    if (!done) return;
    const url = new URL(window.location.href);
    url.searchParams.set("a", code);
    window.history.replaceState(null, "", url);
  }, [done, code]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, done]);

  const results: Suggestion[] = useMemo(
    () => (done ? rankAll(answers, profiles, (k) => bySlug.get(k)?.rank ?? null) : []),
    [done, answers, profiles, bySlug],
  );

  function next(a: Answers, skippedId?: string) {
    const pruned = prune(a);
    const qs = flow(pruned);
    const idx = q ? qs.findIndex((x) => x.id === q.id) : -1;
    setAnswers(pruned);
    if (skippedId) setSkipped((s) => new Set(s).add(skippedId));
    setWhy(false);
    if (idx + 1 >= qs.length) setDone(true);
    else setStep(idx + 1);
  }

  function choose(value: unknown) {
    if (!q) return;
    const s = new Set(skipped);
    s.delete(q.id);
    setSkipped(s);
    next({ ...answers, [q.id]: value } as Answers);
  }

  function skip() {
    if (!q) return;
    const a = { ...answers };
    delete a[q.id];
    next(a, q.id);
  }

  function back() {
    setWhy(false);
    if (done) {
      setDone(false);
      setStep(questions.length - 1);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setAnswers({});
    setSkipped(new Set());
    setStep(0);
    setDone(false);
    setShowAll(false);
    setFit("idle");
    const url = new URL(window.location.href);
    url.searchParams.delete("a");
    window.history.replaceState(null, "", url);
  }

  async function sendFit(value: boolean) {
    const top = results[0];
    if (!top || fit !== "idle") return;
    setFit("sending");
    try {
      await fetch("/api/picker-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topKey: top.key, code, fit: value, website: "" }),
      });
    } catch {
      // A lost vote isn't worth bothering the user about.
    }
    setFit("done");
  }

  async function copyLink() {
    const top = results[0];
    const url = new URL(top ? `/pick/match/${top.key}/` : "/pick/", window.location.origin);
    url.searchParams.set("a", code);
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url.href);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape" && (step > 0 || done)) {
      e.preventDefault();
      back();
    }
  }

  if (done) {
    const top = results.slice(0, 3);
    // Only good matches beyond the top 3; weak ones would just be noise.
    const rest = results.slice(3).filter((r) => r.pct >= GOOD_MATCH);
    const hidden = results.length - top.length - rest.length;
    return (
      <div className="quiz" onKeyDown={onKey}>
        <h2 ref={headingRef} tabIndex={-1}>Your best matches</h2>
        {results.length === 0 ? (
          <p>Nothing we've profiled fits all of that. Try changing the device or memory answer.</p>
        ) : (
          <>
            <div className="results" aria-live="polite">
              {top.map((r, i) => (
                <ResultCard key={r.key} r={r} i={i} d={bySlug.get(r.key)!} p={profileOf.get(r.key)!} server={answers.use === "server"} forUse={forUse} />
              ))}
            </div>
            {top.length >= 2 && (
              <p className="quiz-compare">
                <a href={compareHref(top[0]!.key, top[1]!.key, staticPairs)}>
                  Compare {bySlug.get(top[0]!.key)!.name} and {bySlug.get(top[1]!.key)!.name} side by side →
                </a>
              </p>
            )}
            {rest.length > 0 && (
              <div className="quiz-rest">
                <button type="button" className="link-button" aria-expanded={showAll} onClick={() => setShowAll((s) => !s)}>
                  {showAll ? "Hide other good matches" : `Show ${rest.length} more good ${rest.length === 1 ? "match" : "matches"}`}
                </button>
                {showAll && (
                  <ol className="quiz-list" start={4}>
                    {rest.map((r) => (
                      <li key={r.key}>
                        <a href={`/distro/${r.key}/${forUse}`}>{bySlug.get(r.key)!.name}</a> <span className="sub">{matchLabel(r.pct)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
            {hidden > 0 && (
              <p className="quiz-hidden">
                {hidden} other {hidden === 1 ? "distro matches" : "distros match"} less than half of your answers, so we've left {hidden === 1 ? "it" : "them"} out.
              </p>
            )}
            <div className="quiz-actions">
              <div className="quiz-fit" aria-live="polite">
                {fit === "done" ? (
                  <span>Thanks. Votes are anonymous and help us improve the quiz.</span>
                ) : (
                  <>
                    <span>Did {bySlug.get(results[0]!.key)!.name} fit what you wanted?</span>{" "}
                    <button type="button" disabled={fit !== "idle"} onClick={() => sendFit(true)}>Yes</button>{" "}
                    <button type="button" disabled={fit !== "idle"} onClick={() => sendFit(false)}>No</button>
                  </>
                )}
              </div>
              <button type="button" onClick={copyLink}>{copied ? "Link copied" : "Copy link to these results"}</button>
            </div>
          </>
        )}
        {(answers.from === "windows" || answers.from === "mac") && (
          <p className="switch-link">
            <a href={`/switch/${answers.from}/`}>
              {answers.from === "windows" ? "Switching from Windows" : "Switching from a Mac"}: what changes and which apps to use
            </a>
          </p>
        )}
        <p className="quiz-nav">
          <button type="button" onClick={back}>← Change answers</button>{" "}
          <button type="button" onClick={restart}>Start over</button>
        </p>
        <p className="source-note">
          Suggestions come from hand-written profiles of {profiles.length} popular distros, not from your data. Your answers stay in this page's link; nothing is saved unless you vote. Try a live USB before installing.
        </p>
      </div>
    );
  }

  if (!q) return null;
  const pct = Math.round((step / questions.length) * 100);
  const current = answers[q.id];
  return (
    <div className="quiz quiz-step" onKeyDown={onKey}>
      <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={step} aria-label="Progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="quiz-count">Question {step + 1} of {questions.length}</p>
      <fieldset>
        <legend>
          <h2 ref={headingRef} tabIndex={-1}>{q.legend}</h2>
        </legend>
        <div className="quiz-options">
          {q.options.map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              className="quiz-option"
              aria-pressed={current === value}
              onClick={() => choose(value)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                e.preventDefault();
                const all = [...e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>("button")];
                const i = all.indexOf(e.currentTarget);
                all[(i + (e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length]!.focus();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="quiz-why">
        <button type="button" className="link-button" aria-expanded={why} onClick={() => setWhy((w) => !w)}>Why we ask</button>
        {why && <span className="quiz-why-text"> {q.why}</span>}
      </p>
      <p className="quiz-nav">
        {step > 0 && <button type="button" onClick={back}>← Back</button>}{" "}
        <button type="button" onClick={skip}>Skip this question</button>
      </p>
      <p className="quiz-keys">Arrow keys move, Enter chooses, Esc goes back.</p>
    </div>
  );
}

/** Matches below this aren't listed beyond the top 3. */
export const GOOD_MATCH = 50;

/** Very low percentages read like an error, so say it plainly instead. */
export function matchLabel(pct: number): string {
  return pct >= 25 ? `${pct}% match` : "Weak match";
}

function compareHref(a: string, b: string, staticPairs: string[]): string {
  const slug = compareSlug(a, b);
  return staticPairs.includes(slug) ? `/compare/${slug}/` : `/compare/?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
}

function ResultCard({ r, i, d, p, server, forUse }: { r: Suggestion; i: number; d: PickerDistro; p: PickerProfile; server: boolean; forUse: string }) {
  const t = telemetryFor(r.key);
  return (
    <div className="result">
      <h3>
        {i + 1}. <a href={`/distro/${d.slug}/${forUse}`}>{d.name}</a> <span className="match">{matchLabel(r.pct)}</span>
      </h3>
      <p className="sub">
        {d.rank != null ? `#${d.rank} on DistroWatch (12 months)` : "Not in DistroWatch's top 100"}
        {d.rankTrend ? ` · ${d.rankTrend > 0 ? "up" : "down"} ${Math.abs(d.rankTrend)} in a year` : ""}
      </p>
      <p>{p.blurb}</p>
      {r.reasons.length > 0 && (
        <ul className="why-fits">
          {r.reasons.map((why) => (
            <li key={why}>{why}</li>
          ))}
        </ul>
      )}
      {r.misses.length > 0 && (
        <p className="watch-out">
          <span>Watch out:</span> {r.misses.join("; ")}.
        </p>
      )}
      <p className="telemetry-line">Telemetry: {t ? TELEMETRY_LABEL[t.level] : "not checked yet"}</p>
      <p className="result-links">
        <a href={p.downloadUrl} target="_blank" rel="noopener noreferrer">Official download</a>
        {p.distrosea && (
          <>
            {" · "}
            <a href={`https://distrosea.com/select/${p.distrosea}/`} target="_blank" rel="noopener noreferrer">Try it in your browser</a>
          </>
        )}
        {" · "}
        <a href={`/distro/${d.slug}/${forUse}`}>{forUse ? "Pros and cons for this use" : "Rank, ratings, pros and cons"}</a>
        {server && i === 0 && (
          <>
            {" · "}
            <a href={`/distro/${d.slug}/#cloud`}>Run it on a cloud server</a>
          </>
        )}
      </p>
    </div>
  );
}
