import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Distro, Section, Status, When, ago } from "./AdminParts";

export interface ModerationRow {
  id: number;
  distro: { slug: string; name: string };
  author: { username: string; provider: string; accountCreatedAt: string | null; joinedAt: string };
  rating: number | null;
  usesIt: boolean;
  reviewBody: string | null;
  status: "visible" | "hidden" | "removed";
  createdAt: string;
  updatedAt: string;
  hiddenAt: string | null;
  hiddenReason: string | null;
}

const DAY = 86_400_000;

/** Plain trust note from what we know about the account: forge age and time on this site. */
export function trustNote(a: ModerationRow["author"], now = Date.now()): string {
  const forge = a.provider === "github" ? "GitHub" : a.provider === "gitlab" ? "GitLab" : "Codeberg";
  if (!a.accountCreatedAt) return `${forge} account, age unknown`;
  const days = (now - new Date(a.accountCreatedAt).getTime()) / DAY;
  if (days < 30) return `New ${forge} account (${Math.floor(days)} days old)`;
  const years = Math.floor(days / 365);
  return years >= 1 ? `${forge} account, ${years} ${years === 1 ? "year" : "years"} old` : `${forge} account, ${Math.floor(days / 30)} months old`;
}

function Row({ r }: { r: ModerationRow }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [asking, setAsking] = useState(false);
  const m = useMutation({
    mutationFn: async (body: { action: "hide"; reason: string } | { action: "unhide" }) => {
      const res = await fetch(`/api/admin/contributions/${r.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(String(res.status));
    },
    onSuccess: () => {
      setAsking(false);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["admin-ratings"] });
    },
  });
  const hidden = r.status === "hidden";
  const edited = r.updatedAt !== r.createdAt;
  const fresh = r.author.accountCreatedAt != null && Date.now() - new Date(r.author.accountCreatedAt).getTime() < 30 * DAY;
  const reasonId = `hide-reason-${r.id}`;
  return (
    <li className={`adm-item${hidden ? " is-muted" : ""}`}>
      <div className="adm-item-head">
        <Distro slug={r.distro.slug} name={r.distro.name} />
        {r.rating != null && <span className="adm-stars" role="img" aria-label={`${r.rating} of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>}
        {r.usesIt && <Status>Uses it</Status>}
        {hidden && <Status tone="bad">Hidden</Status>}
        <span className="adm-item-when"><When iso={edited ? r.updatedAt : r.createdAt} relative />{edited ? ", edited" : ""}</span>
      </div>
      {r.reviewBody ? <p className="adm-item-body">{r.reviewBody}</p> : <p className="note">Rating only, no written review.</p>}
      <p className="adm-item-meta">
        <span><strong>{r.author.username}</strong></span>
        <span>{fresh ? <Status tone="warn">{trustNote(r.author)}</Status> : trustNote(r.author)}</span>
        <span>Joined here {ago(r.author.joinedAt)}</span>
      </p>
      {hidden && r.hiddenReason && <p className="note">Hidden {r.hiddenAt ? ago(r.hiddenAt) : ""}. Reason: {r.hiddenReason}</p>}
      <div className="adm-item-foot">
        {hidden ? (
          <div className="adm-actions">
            <button type="button" className="adm-btn" disabled={m.isPending} aria-busy={m.isPending} onClick={() => m.mutate({ action: "unhide" })}>
              {m.isPending ? "Unhiding…" : "Unhide"}
            </button>
          </div>
        ) : asking ? (
          <form
            className="adm-hide-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim().length >= 3) m.mutate({ action: "hide", reason: reason.trim() });
            }}
          >
            <label htmlFor={reasonId}>Why hide it</label>
            <input id={reasonId} className="adm-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Spam, off-topic, abusive…" maxLength={300} required minLength={3} autoFocus aria-describedby={`${reasonId}-help`} />
            <p className="note" id={`${reasonId}-help`}>Saved with the rating and in the moderation log. At least 3 characters.</p>
            <div className="adm-actions">
              <button type="submit" className="adm-btn danger" disabled={m.isPending || reason.trim().length < 3} aria-busy={m.isPending}>{m.isPending ? "Hiding…" : "Hide rating"}</button>
              <button type="button" className="adm-btn quiet" onClick={() => setAsking(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="adm-actions">
            <button type="button" className="adm-btn" onClick={() => setAsking(true)}>Hide…</button>
          </div>
        )}
      </div>
      {m.isError && <p className="error" role="alert">Couldn't save. Reload and try again.</p>}
    </li>
  );
}

function List({ rows }: { rows: ModerationRow[] }) {
  const [tab, setTab] = useState<"visible" | "hidden">("visible");
  const shown = rows.filter((r) => r.status === tab);
  const n = (s: "visible" | "hidden") => rows.filter((r) => r.status === s).length;
  return (
    <div className="adm">
      <Section title="Ratings and reviews" sub="Newest first">
        <div className="adm-tabs" role="tablist" aria-label="Ratings">
          {(["visible", "hidden"] as const).map((t) => (
            <button key={t} type="button" role="tab" id={`tab-${t}`} aria-controls="ratings-panel" className="adm-tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === "visible" ? "Shown" : "Hidden"}<span className="adm-count">{n(t)}</span>
            </button>
          ))}
        </div>
        <div id="ratings-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {shown.length === 0 ? (
            <p className="adm-empty">{tab === "visible" ? "No ratings yet. They appear here as soon as someone rates a distro." : "Nothing hidden."}</p>
          ) : (
            <ul className="adm-items">{shown.map((r) => <Row key={r.id} r={r} />)}</ul>
          )}
        </div>
        <p className="note">Hide only: nothing a person wrote is edited or deleted. A hidden rating stays hidden if its author edits it.</p>
      </Section>
    </div>
  );
}

export function AdminRatingsInner() {
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["admin-ratings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ratings", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as ModerationRow[];
    },
    enabled: me?.role === "admin",
  });
  return (
    <AdminGate>
      {q.isError ? <p className="error" role="alert">Couldn't load ratings. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading ratings" /> : <List rows={q.data} />}
    </AdminGate>
  );
}

/** Island: rating and review moderation (hide only) for the admin. */
export function AdminRatings() {
  return (
    <Island>
      <AdminRatingsInner />
    </Island>
  );
}
