import { useMemo, useState } from "react";
import { CardsSkeleton } from "./Skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SUGGESTION_STATUSES, type AdminSuggestion, type SuggestionStatus } from "@linux-statistics/shared";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Section, Status, When, type Tone } from "./AdminParts";

const KIND_LABEL: Record<string, string> = {
  "add-distro": "Add a distro",
  correction: "Correction",
  idea: "Idea",
  other: "Other",
};
const TAB_LABEL: Record<SuggestionStatus, string> = { new: "New", done: "Done", dismissed: "Dismissed" };

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

const KIND_TONE: Record<string, Tone> = { "add-distro": "info", correction: "warn", idea: "neutral", other: "neutral" };

function SuggestionCard({
  s,
  onStatus,
  onDelete,
  busy,
}: {
  s: AdminSuggestion;
  onStatus: (status: SuggestionStatus) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const reply = s.email
    ? `mailto:${s.email}?subject=${encodeURIComponent(`Re: your LinuxStatistics suggestion${s.subject ? ` (${s.subject})` : ""}`)}`
    : null;
  return (
    <li>
      <article className="adm-item" aria-label={`Suggestion ${s.id}`}>
      <div className="adm-item-head">
        <Status tone={KIND_TONE[s.kind] ?? "neutral"}>{KIND_LABEL[s.kind] ?? s.kind}</Status>
        {s.subject && <span className="adm-item-title">{s.subject}</span>}
        <span className="adm-item-when"><When iso={s.createdAt} relative /></span>
      </div>
      <p className="adm-item-body">{s.message}</p>
      <div className="adm-item-foot">
        <p className="adm-item-meta">
          <span>{s.username ? <><strong>{s.username}</strong> ({s.provider})</> : "Not signed in"}</span>
          {s.email && <span>{s.email}</span>}
        </p>
        <div className="adm-actions">
          {s.status !== "done" && (
            <button type="button" className="adm-btn primary" disabled={busy} onClick={() => onStatus("done")}>Mark done</button>
          )}
          {reply && <a className="adm-btn" href={reply}>Reply</a>}
          {s.status !== "dismissed" && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => onStatus("dismissed")}>Dismiss</button>
          )}
          {s.status !== "new" && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => onStatus("new")}>Reopen</button>
          )}
          {confirm ? (
            <>
              <button type="button" className="adm-btn danger" disabled={busy} onClick={onDelete}>Delete for good</button>
              <button type="button" className="adm-btn quiet" onClick={() => setConfirm(false)}>Keep</button>
            </>
          ) : (
            <button type="button" className="adm-btn quiet" disabled={busy} onClick={() => setConfirm(true)}>Delete</button>
          )}
        </div>
      </div>
      </article>
    </li>
  );
}

export function AdminSuggestionsInner() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin";
  const [tab, setTab] = useState<SuggestionStatus>("new");
  const [kind, setKind] = useState<string>("all");
  const [q, setQ] = useState("");

  // One request for everything; tabs, counts and filters are computed here.
  const list = useQuery({
    queryKey: ["admin-suggestions"],
    queryFn: () => api<AdminSuggestion[]>("GET", "/api/admin/suggestions"),
    enabled: isAdmin,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SuggestionStatus }) => api("PATCH", `/api/admin/suggestions/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-suggestions"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api("DELETE", `/api/admin/suggestions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-suggestions"] }),
  });

  const all = list.data ?? [];
  const counts = useMemo(() => {
    const c: Record<SuggestionStatus, number> = { new: 0, done: 0, dismissed: 0 };
    for (const s of all) c[s.status]++;
    return c;
  }, [all]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (s) =>
        s.status === tab &&
        (kind === "all" || s.kind === kind) &&
        (!needle || `${s.subject ?? ""} ${s.message} ${s.email ?? ""} ${s.username ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [all, tab, kind, q]);

  const busy = setStatus.isPending || remove.isPending;
  return (
    <AdminGate>
      {list.isError ? (
        <p className="error" role="alert">Couldn't load suggestions. Try reloading.</p>
      ) : (
        <div className="adm">
          <Section title="Queue" sub={`${counts.new} new`}>
            <div className="adm-tabs" role="tablist" aria-label="Status">
              {SUGGESTION_STATUSES.map((st) => (
                <button key={st} type="button" role="tab" id={`stab-${st}`} aria-controls="suggestions-panel" aria-selected={tab === st} className="adm-tab" onClick={() => setTab(st)}>
                  {TAB_LABEL[st]} <span className="adm-count">{counts[st]}</span>
                </button>
              ))}
            </div>
            <div className="adm-filters">
              <label className="adm-field">
                <span>Search</span>
                <input type="search" placeholder="Message, subject or sender" aria-label="Search suggestions" value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
              <label className="adm-field is-narrow">
                <span>Type</span>
                <select aria-label="Filter by type" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="all">All types</option>
                  {Object.entries(KIND_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </label>
            </div>
            <div id="suggestions-panel" role="tabpanel" aria-labelledby={`stab-${tab}`}>
              {list.isLoading ? (
                <CardsSkeleton label="Loading suggestions" />
              ) : shown.length === 0 ? (
                <p className="adm-empty">{tab === "new" && !q && kind === "all" ? "Nothing new. All caught up." : "No suggestions match."}</p>
              ) : (
                <ul className="adm-items">
                  {shown.map((s) => (
                    <SuggestionCard key={s.id} s={s} busy={busy} onStatus={(status) => setStatus.mutate({ id: s.id, status })} onDelete={() => remove.mutate(s.id)} />
                  ))}
                </ul>
              )}
            </div>
            {(setStatus.isError || remove.isError) && <p className="error" role="alert">That change didn't save. Try again.</p>}
          </Section>
        </div>
      )}
    </AdminGate>
  );
}

/** Island: the admin suggestions queue. */
export function AdminSuggestions() {
  return (
    <Island>
      <AdminSuggestionsInner />
    </Island>
  );
}
