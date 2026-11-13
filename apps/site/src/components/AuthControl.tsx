import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe, useProviders, loginHref, logout, devLogin } from "../api";
import { AuthSkeleton } from "./Skeleton";
import { rememberAuth } from "../lib/auth-hint";

export function AuthControl() {
  const { data: me, isPending: mePending } = useMe();
  const { data: providers, isPending: providersPending } = useProviders();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!mePending) rememberAuth(Boolean(me));
  }, [me, mePending]);

  if (mePending || (!me && providersPending)) return <AuthSkeleton />;

  if (me) {
    return <AccountMenu me={me} onSignOut={async () => {
      await logout();
      qc.invalidateQueries({ queryKey: ["me"] });
    }} />;
  }

  const list = providers ?? [];

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
        aria-label="Sign in"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="signin-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
        <span className="signin-label">Sign in</span>
        <span className="t-acc-chevron" aria-hidden>
          <svg viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5" /></svg>
        </span>
      </button>
      {open && <button type="button" className="signin-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      {open && (
        <div className="signin-popover" role="menu">
          {list.length === 0 && (
            <p className="signin-note" role="note">
              Sign-in is coming soon: rate distros and mark the ones you use with your GitHub, GitLab or Codeberg account.
            </p>
          )}
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

const PROVIDER_NAMES: Record<string, string> = { github: "GitHub", gitlab: "GitLab", codeberg: "Codeberg", dev: "dev login" };

/** Signed-in control: the username opens a small account menu. */
function AccountMenu({
  me,
  onSignOut,
}: {
  me: { username: string; provider: string; avatarUrl: string | null; role?: string };
  onSignOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstItem = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItem.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="auth-control signin-menu account-menu" data-open={open}>
      <button
        ref={trigger}
        type="button"
        className="signin-trigger account-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${me.username}`}
        onClick={() => setOpen((o) => !o)}
      >
        {me.avatarUrl ? (
          <img src={me.avatarUrl} alt="" className="avatar" width={20} height={20} />
        ) : (
          <span className="avatar avatar-initial" aria-hidden>
            {me.username.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="login">{me.username}</span>
        <span className="t-acc-chevron" aria-hidden>
          <svg viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5" /></svg>
        </span>
      </button>
      {open && <button type="button" className="signin-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      {open && (
        <div className="signin-popover" role="menu" aria-label="Account">
          <div className="menu-head" role="presentation">
            Signed in with {PROVIDER_NAMES[me.provider] ?? me.provider}
            <b>{me.username}</b>
          </div>
          {me.role === "admin" && (
            <>
              <a role="menuitem" className="signin-option" href="/admin/suggestions/">
                Admin: suggestions
              </a>
              <a role="menuitem" className="signin-option" href="/admin/rank/">
                Admin: rank comparison
              </a>
              <a role="menuitem" className="signin-option" href="/admin/affiliates/">
                Admin: affiliate clicks
              </a>
            </>
          )}
          <button
            ref={firstItem}
            type="button"
            role="menuitem"
            className="signin-option"
            onClick={async () => {
              setOpen(false);
              await onSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
