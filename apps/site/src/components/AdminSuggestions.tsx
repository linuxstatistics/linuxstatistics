import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SUGGESTION_STATUSES, type AdminSuggestion, type SuggestionStatus } from "@linux-statistics/shared";
import { useMe } from "../api";
import { Island } from "./Island";

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

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

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
    <article className="adm-card" aria-label={`Suggestion ${s.id}`}>
      <header className="adm-card-head">
        <span className={`adm-kind k-${s.kind}`}>{KIND_LABEL[s.kind] ?? s.kind}</span>
        {s.subject && <strong className="adm-subject">{s.subject}</strong>}
        <time dateTime={s.createdAt}>{when(s.createdAt)}</time>
      </header>
      <p className="adm-message">{s.message}</p>
      <footer className="adm-card-foot">
        <span className="adm-from">
          {s.username ? `${s.username} (${s.provider})` : "Not signed in"}
          {s.email && <> · {s.email}</>}
        </span>
        <span className="adm-actions">
          {reply && (
            <a className="adm-btn" href={reply}>
              Reply
            </a>
          )}
          {s.status !== "done" && (
            <button type="button" className="adm-btn primary" disabled={busy} onClick={() => onStatus("done")}>
              Mark done
            </button>
          )}
          {s.status !== "dismissed" && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => onStatus("dismissed")}>
              Dismiss
            </button>
          )}
          {s.status !== "new" && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => onStatus("new")}>
              Reopen
            </button>
          )}
          {confirm ? (
            <>
              <button type="button" className="adm-btn danger" disabled={busy} onClick={onDelete}>
                Delete for good
              </button>
              <button type="button" className="adm-btn" onClick={() => setConfirm(false)}>
                Keep
              </button>
            </>
          ) : (
            <button type="button" className="adm-btn subtle" disabled={busy} onClick={() => setConfirm(true)}>
              Delete
            </button>
          )}
        </span>
      </footer>
    </article>
  );
}

export function AdminSuggestionsInner() {
  const qc = useQueryClient();
  const { data: me, isLoading: meLoading } = useMe();
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

  if (meLoading) return <p className="loading">Checking your account…</p>;
  if (!me) return <p className="adm-gate">Sign in with an admin account to see this page.</p>;
  if (!isAdmin) return <p className="adm-gate">Your account isn't an admin. Ask the site owner to add it to ADMIN_USERS.</p>;
  if (list.isError) return <p className="error">Couldn't load suggestions. Try reloading.</p>;

  const busy = setStatus.isPending || remove.isPending;
  return (
    <div className="adm">
      <div className="adm-tabs" role="tablist" aria-label="Status">
        {SUGGESTION_STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            role="tab"
            aria-selected={tab === st}
            className="adm-tab"
            onClick={() => setTab(st)}
          >
            {TAB_LABEL[st]} <span className="adm-count">{counts[st]}</span>
          </button>
        ))}
      </div>
      <div className="adm-filters">
        <input type="search" placeholder="Search messages, subjects, senders…" aria-label="Search suggestions" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by type" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {list.isLoading ? (
        <p className="loading">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="adm-empty">{tab === "new" && !q && kind === "all" ? "Nothing new. All caught up." : "No suggestions match."}</p>
      ) : (
        <div className="adm-list" role="tabpanel">
          {shown.map((s) => (
            <SuggestionCard
              key={s.id}
              s={s}
              busy={busy}
              onStatus={(status) => setStatus.mutate({ id: s.id, status })}
              onDelete={() => remove.mutate(s.id)}
            />
          ))}
        </div>
      )}
      {(setStatus.isError || remove.isError) && <p className="error" role="alert">That change didn't save. Try again.</p>}
    </div>
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
