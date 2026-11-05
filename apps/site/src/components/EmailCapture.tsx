import { useState } from "react";
import { useEmailSignup } from "../api";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const signup = useEmailSignup();

  if (signup.isSuccess) {
    return <p className="email-capture-done">Thanks, you're on the list.</p>;
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
          onChange={(e) => { setEmail(e.target.value); setInvalid(false); }}
        />
        <button type="submit" disabled={signup.isPending}>Subscribe</button>
      </div>
      {invalid && <p className="email-capture-error" role="alert">Enter a valid email.</p>}
      {signup.isError && (
        <p className="email-capture-error" role="alert">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
