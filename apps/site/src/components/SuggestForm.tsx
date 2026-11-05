import { useEffect, useState } from "react";
import { SUGGESTION_KINDS, type SuggestionInput } from "@linux-statistics/shared";

const LABELS: Record<(typeof SUGGESTION_KINDS)[number], string> = {
  "add-distro": "Add a distro",
  correction: "Fix wrong or outdated information",
  idea: "Idea for the site",
  other: "Something else",
};
const SUBJECT_HINT: Record<(typeof SUGGESTION_KINDS)[number], string> = {
  "add-distro": "Distro name and website",
  correction: "Which page or distro",
  idea: "Short title (optional)",
  other: "Short title (optional)",
};

/** Suggestion form. Posts to /api/suggestions; nothing is public. */
export function SuggestForm() {
  const [kind, setKind] = useState<SuggestionInput["kind"]>("add-distro");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Prefill from links like /suggest/?kind=correction&subject=mint
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const k = p.get("kind");
    if (k && (SUGGESTION_KINDS as readonly string[]).includes(k)) setKind(k as SuggestionInput["kind"]);
    const s = p.get("subject");
    if (s) setSubject(s.slice(0, 200));
  }, []);

  if (state === "sent") {
    return (
      <div className="suggest-done" role="status">
        <h2>Thanks, we've got it.</h2>
        <p>We read every suggestion. {email ? "If we need more detail we'll email you." : ""}</p>
        <button type="button" onClick={() => { setMessage(""); setSubject(""); setState("idle"); }}>
          Send another
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) {
      setError("Please write at least a sentence (10 characters).");
      return;
    }
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, subject: subject || undefined, message, email, website }),
      });
      if (res.status === 429) throw new Error("You've sent a few already. Please try again in a little while.");
      if (!res.ok) throw new Error("Something went wrong. Check the email address and try again.");
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <form className="suggest-form" onSubmit={submit} noValidate>
      <fieldset>
        <legend>What's it about?</legend>
        <div className="suggest-kinds">
          {SUGGESTION_KINDS.map((k) => (
            <label key={k}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} /> {LABELS[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>{SUBJECT_HINT[kind]}</span>
        <input type="text" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className="field">
        <span>Your suggestion</span>
        <textarea value={message} maxLength={4000} rows={6} required onChange={(e) => setMessage(e.target.value)} />
      </label>
      <label className="field">
        <span>Email (optional, only if you'd like a reply)</span>
        <input type="email" value={email} maxLength={320} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="hp" aria-hidden="true">
        Website <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>
      {error && <p className="email-capture-error" role="alert">{error}</p>}
      <button type="submit" className="primary" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send suggestion"}
      </button>
    </form>
  );
}
