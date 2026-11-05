import { useState } from "react";
import { suggest, type Answers, type Suggestion } from "../lib/picker";
import { PROFILES } from "../lib/picker-profiles";
import { TELEMETRY_LABEL, telemetryFor } from "../lib/telemetry";

type Q<K extends keyof Answers> = { key: K; legend: string; options: [Answers[K], string][] };

const QUESTIONS: [Q<"from">, Q<"level">, Q<"use">, Q<"hardware">, Q<"updates">, Q<"desktop">, Q<"telemetry">] = [
  { key: "from", legend: "Where are you coming from?", options: [["windows", "Windows"], ["mac", "Mac"], ["linux", "I already use Linux"], ["chromeos", "ChromeOS"]] },
  { key: "level", legend: "How much Linux have you used?", options: [["new", "None or very little"], ["some", "Some: I can use a terminal"], ["expert", "A lot: I like setting things up myself"]] },
  { key: "use", legend: "What's it mainly for?", options: [["everyday", "Everyday use: web, email, office"], ["gaming", "Gaming"], ["dev", "Programming and development"], ["old-hw", "Reviving an old computer"], ["privacy", "Privacy and security"]] },
  { key: "hardware", legend: "How old is the computer?", options: [["new", "Less than about 8 years"], ["old", "Older, or under 4 GB of RAM"]] },
  { key: "updates", legend: "How do you like updates?", options: [["stable", "Stable: tested releases, fewer surprises"], ["rolling", "Rolling: always the newest software"], ["any", "No preference"]] },
  { key: "desktop", legend: "Which desktop would you like?", options: [["windows-like", "Like Windows"], ["mac-like", "Like macOS"], ["gnome", "GNOME"], ["kde", "KDE Plasma"], ["light", "Light and simple"], ["any", "No preference"]] },
  { key: "telemetry", legend: "Should the system send any usage data?", options: [["none", "No: nothing unless I agree"], ["any", "Anonymous counting is fine"]] },
];

export interface PickerDistro {
  slug: string;
  name: string;
  rank: number | null;
}

/** "Which distro should I use?" quiz. Runs entirely in the browser; nothing is stored. */
export function DistroPicker({ distros }: { distros: PickerDistro[] }) {
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const bySlug = new Map(distros.map((d) => [d.slug, d]));
  const profiles = PROFILES.filter((p) => bySlug.has(p.key));
  const complete = QUESTIONS.every((q) => answers[q.key] !== undefined);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setResults(suggest(answers as Answers, profiles, (k) => bySlug.get(k)?.rank ?? null));
  }

  return (
    <form className="quiz" onSubmit={submit}>
      {QUESTIONS.map((q) => (
        <fieldset key={q.key}>
          <legend>{q.legend}</legend>
          {q.options.map(([value, label]) => (
            <label key={String(value)}>
              <input
                type="radio"
                name={q.key}
                value={String(value)}
                checked={answers[q.key] === value}
                onChange={() => {
                  setAnswers((a) => ({ ...a, [q.key]: value }));
                  setResults(null);
                }}
              />{" "}
              {label}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="submit" className="primary" disabled={!complete}>
        Show my matches
      </button>
      {results && (
        <div className="results" aria-live="polite">
          <h2>Your best matches</h2>
          {results.map((r, i) => {
            const d = bySlug.get(r.key)!;
            const p = PROFILES.find((x) => x.key === r.key)!;
            return (
              <div className="result" key={r.key}>
                <h3>
                  {i + 1}. <a href={`/distro/${d.slug}/`}>{d.name}</a>
                  {d.rank != null && <span className="sub"> · #{d.rank} on DistroWatch</span>}
                </h3>
                <p>{p.blurb}</p>
                <p className="telemetry-line">
                  Telemetry: {(() => {
                    const t = telemetryFor(r.key);
                    return t ? TELEMETRY_LABEL[t.level] : "not checked yet";
                  })()}
                </p>
                <ul>
                  {r.reasons.map((why) => (
                    <li key={why}>{why}</li>
                  ))}
                </ul>
              </div>
            );
          })}
          {(answers.from === "windows" || answers.from === "mac") && (
            <p className="switch-link">
              <a href={`/switch/${answers.from}/`}>
                {answers.from === "windows" ? "Switching from Windows" : "Switching from a Mac"}: what changes and which apps to use
              </a>
            </p>
          )}
          <p className="source-note">
            Suggestions come from hand-written profiles of {profiles.length} popular distros, not from your data. Try a live USB before installing.
          </p>
        </div>
      )}
    </form>
  );
}
