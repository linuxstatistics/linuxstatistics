import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe, useProviders, loginHref, logout, devLogin } from "../api";

export function AuthControl() {
  const { data: me } = useMe();
  const { data: providers } = useProviders();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  if (me) {
    return (
      <span className="auth-control">
        {me.avatarUrl && <img src={me.avatarUrl} alt="" className="avatar" width={20} height={20} />}
        <span className="login">{me.username}</span>
        <button
          type="button"
          className="signout"
          onClick={async () => {
            await logout();
            qc.invalidateQueries({ queryKey: ["me"] });
          }}
        >
          Sign out
        </button>
      </span>
    );
  }

  const list = providers ?? [];
  if (list.length === 0) return null;

  const handleDev = async () => {
    await devLogin();
    qc.invalidateQueries({ queryKey: ["me"] });
    setOpen(false);
  };

  return (
    <div className="auth-control signin-menu" data-open={open}>
      <button
        type="button"
        className="signin signin-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        Sign in
        <span className="t-acc-chevron" aria-hidden>
          <svg viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5" /></svg>
        </span>
      </button>
      {open && <button type="button" className="signin-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      {open && (
        <div className="signin-popover" role="menu">
          {list.map((p) =>
            p.slug === "dev" ? (
              <button key="dev" type="button" role="menuitem" className="signin-option" onClick={handleDev}>
                {p.displayName}
              </button>
            ) : (
              <a key={p.slug} role="menuitem" className="signin-option" href={loginHref(p.slug)}>
                Sign in with {p.displayName}
              </a>
            ),
          )}
        </div>
      )}
    </div>
  );
}
