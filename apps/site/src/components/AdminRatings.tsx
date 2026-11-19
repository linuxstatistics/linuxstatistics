import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { daysAgoText } from "../lib/freshness";

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

const ago = (iso: string) => daysAgoText((Date.now() - new Date(iso).getTime()) / 86_400_000);
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
  return (
    <li className={`adm-review${hidden ? " is-hidden" : ""}`}>
      <div className="adm-review-head">
        <a href={`/distro/${r.distro.slug}/`}>{r.distro.name}</a>
        {r.rating != null && <span className="adm-stars" aria-label={`${r.rating} of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>}
        {r.usesIt && <span className="adm-status">uses it</span>}
        {hidden && <span className="adm-status adm-failed">hidden</span>}
      </div>
      {r.reviewBody ? <p className="adm-review-body">{r.reviewBody}</p> : <p className="note">No written review.</p>}
      <p className="note">
        {r.author.username} · {trustNote(r.author)} · joined here {ago(r.author.joinedAt)} · {r.updatedAt !== r.createdAt ? `edited ${ago(r.updatedAt)}` : ago(r.createdAt)}
      </p>
      {hidden && r.hiddenReason && <p className="note">Hidden {r.hiddenAt ? ago(r.hiddenAt) : ""}: {r.hiddenReason}</p>}
      {hidden ? (
        <button type="button" className="adm-toggle" disabled={m.isPending} onClick={() => m.mutate({ action: "unhide" })}>Unhide</button>
      ) : asking ? (
        <form
          className="adm-hide-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim().length >= 3) m.mutate({ action: "hide", reason: reason.trim() });
          }}
        >
          <label>
            <span className="visually-hidden">Why hide it</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why hide it (spam, off-topic, abusive…)" maxLength={300} required minLength={3} autoFocus />
          </label>
          <button type="submit" className="adm-toggle" disabled={m.isPending || reason.trim().length < 3}>Hide</button>
          <button type="button" className="adm-link" onClick={() => setAsking(false)}>Cancel</button>
        </form>
      ) : (
        <button type="button" className="adm-toggle" onClick={() => setAsking(true)}>Hide…</button>
      )}
      {m.isError && <p className="error">Couldn't save. Reload and try again.</p>}
    </li>
  );
}

function List({ rows }: { rows: ModerationRow[] }) {
  const [tab, setTab] = useState<"visible" | "hidden">("visible");
  const shown = rows.filter((r) => r.status === tab);
  const n = (s: "visible" | "hidden") => rows.filter((r) => r.status === s).length;
  return (
    <div className="adm">
      <div className="adm-tabs" role="tablist">
        {(["visible", "hidden"] as const).map((t) => (
          <button key={t} type="button" role="tab" className="adm-tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === "visible" ? "Shown" : "Hidden"}<span className="adm-count">{n(t)}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="note">{tab === "visible" ? "No ratings yet." : "Nothing hidden."}</p>
      ) : (
        <ul className="adm-reviews">{shown.map((r) => <Row key={r.id} r={r} />)}</ul>
      )}
      <p className="note">Hide only: nothing a person wrote is edited or deleted. Hiding needs a reason and is logged; a hidden rating stays hidden if its author edits it.</p>
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
      {q.isError ? <p className="error">Couldn't load ratings. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading ratings" /> : <List rows={q.data} />}
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
