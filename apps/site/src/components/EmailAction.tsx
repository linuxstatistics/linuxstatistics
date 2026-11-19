import { useEffect, useState } from "react";

type Kind = "confirm" | "unsubscribe";
type State = "ready" | "missing" | "working" | "done" | "invalid" | "expired" | "error";

const COPY: Record<Kind, { button: string; working: string; done: { title: string; body: string } }> = {
  confirm: {
    button: "Confirm my subscription",
    working: "Confirming…",
    done: { title: "You're subscribed.", body: "The State of Linux Distros arrives early each month. Every email has a one-click unsubscribe link." },
  },
  unsubscribe: {
    button: "Unsubscribe",
    working: "Unsubscribing…",
    done: { title: "You're unsubscribed.", body: "You won't get the monthly email any more. We keep the address only so we never mail it again." },
  },
};

/**
 * Confirm or unsubscribe with a button press, never on page load: mail
 * scanners open links in emails, and a load-time action would confirm or
 * unsubscribe people without them knowing.
 */
export function EmailAction({ kind }: { kind: Kind }) {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<State>("ready");
  const copy = COPY[kind];

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    if (t) setToken(t);
    else setState("missing");
    // Keep the token out of the address bar, history and any referrer.
    if (t) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function run() {
    if (!token) return;
    setState("working");
    try {
      const res = await fetch(`/api/email-signups/${kind}`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
      if (res.ok && body.ok) setState("done");
      else if (body.reason === "expired") setState("expired");
      else if (body.reason === "invalid") setState("invalid");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="email-action-done" role="status">
        <h2>{copy.done.title}</h2>
        <p>{copy.done.body}</p>
      </div>
    );
  }
  if (state === "missing" || state === "invalid" || state === "expired") {
    const msg =
      state === "expired"
        ? "This link has expired. Links work for 7 days."
        : kind === "confirm"
          ? "This link isn't valid any more. It may have been used already, or a newer email replaced it."
          : "This link isn't valid. Copy the whole link from the email, or reply to any of our emails and we'll take you off the list.";
    return (
      <div className="email-action-problem" role="alert">
        <p>{msg}</p>
        {kind === "confirm" && <p>Sign up again with the form at the bottom of this page and we'll send a new link.</p>}
      </div>
    );
  }
  return (
    <div className="email-action">
      <button type="button" className="primary" onClick={run} disabled={state === "working" || !token}>
        {state === "working" ? copy.working : copy.button}
      </button>
      {state === "error" && (
        <p className="email-capture-error" role="alert">
          <span className="email-capture-error-icon" aria-hidden="true">!</span>
          Something went wrong on our side. Try again in a moment.
        </p>
      )}
    </div>
  );
}
