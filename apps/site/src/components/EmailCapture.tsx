import { useState } from "react";
import { useEmailSignup } from "../api";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const signup = useEmailSignup();

  if (signup.isSuccess) {
    return (
      <div className="email-capture-done" role="status">
        <span className="email-capture-check" aria-hidden="true">
          <svg viewBox="0 0 16 16"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" /></svg>
        </span>
        <span className="email-capture-done-text">
          <strong>You're on the list.</strong>
          <span>The first report arrives early next month. Unsubscribe any time.</span>
        </span>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    signup.mutate({ email, source: "footer" });
  };

  return (
    <form className="email-capture" onSubmit={onSubmit} noValidate>
      <label htmlFor="email-capture-input" className="visually-hidden">Email for the State of Linux Distros report</label>
      <div className="email-capture-row">
        <input
          id="email-capture-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid || signup.isError ? "email-capture-msg" : undefined}
          onChange={(e) => { setEmail(e.target.value); setInvalid(false); }}
        />
        <button type="submit" disabled={signup.isPending}>Subscribe</button>
      </div>
      {(invalid || signup.isError) && (
        <p id="email-capture-msg" className="email-capture-error" role="alert">
          <span className="email-capture-error-icon" aria-hidden="true">!</span>
          {invalid ? "That doesn't look like an email address. Check it and try again." : "Something went wrong on our side. Try again in a moment."}
        </p>
      )}
    </form>
  );
}
