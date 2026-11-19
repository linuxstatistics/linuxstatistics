/**
 * One way to send email, used by the API and the worker. Resend in
 * production, a recorder in tests, and nothing when no key is set (local dev).
 * Templates live here too so every email carries the unsubscribe headers.
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
  /** Resend idempotency key: a retry with the same key doesn't send twice. */
  idempotencyKey?: string;
}

export interface Mailer {
  /** False when sending is switched off (no API key); send() is then a no-op. */
  readonly enabled: boolean;
  send(msg: OutgoingEmail): Promise<void>;
  /** Add or update a contact and put it in the newsletter segment. */
  addContact(email: string): Promise<void>;
  /** Mark a contact unsubscribed from Broadcasts. Unknown contacts are ignored. */
  unsubscribeContact(email: string): Promise<void>;
  /** Addresses in the newsletter segment that unsubscribed in Resend (e.g. its Broadcast link). */
  listUnsubscribed(): Promise<string[]>;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface ResendConfig {
  apiKey: string;
  from: string;
  replyTo?: string;
  /** Segment the monthly Broadcast goes to. Without it, contacts aren't synced. */
  segmentId?: string;
}

const API = "https://api.resend.com";

export function resendMailer(cfg: ResendConfig, doFetch: FetchLike = fetch): Mailer {
  const headers = (extra: Record<string, string> = {}) => ({
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
    ...extra,
  });
  async function call(method: string, path: string, body?: unknown, extra?: Record<string, string>): Promise<Response> {
    const res = await doFetch(`${API}${path}`, { method, headers: headers(extra), body: body === undefined ? undefined : JSON.stringify(body) });
    return res;
  }
  async function ok(res: Response, what: string): Promise<void> {
    if (!res.ok) throw new Error(`Resend ${what}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return {
    enabled: true,
    async send(msg) {
      const res = await call(
        "POST",
        "/emails",
        {
          from: cfg.from,
          to: [msg.to],
          subject: msg.subject,
          text: msg.text,
          html: msg.html,
          ...(cfg.replyTo ? { reply_to: cfg.replyTo } : {}),
          ...(msg.headers ? { headers: msg.headers } : {}),
        },
        msg.idempotencyKey ? { "Idempotency-Key": msg.idempotencyKey } : undefined,
      );
      await ok(res, "send");
    },
    async addContact(email) {
      if (!cfg.segmentId) return;
      const enc = encodeURIComponent(email);
      // Create if new (an existing contact may answer an error or not), then
      // always clear an earlier unsubscribe, then add to the segment.
      await call("POST", "/contacts", { email, unsubscribed: false });
      await ok(await call("PATCH", `/contacts/${enc}`, { unsubscribed: false }), "update contact");
      await ok(await call("POST", `/contacts/${enc}/segments/${encodeURIComponent(cfg.segmentId)}`), "add to segment");
    },
    async unsubscribeContact(email) {
      const res = await call("PATCH", `/contacts/${encodeURIComponent(email)}`, { unsubscribed: true });
      if (res.status === 404) return;
      await ok(res, "unsubscribe contact");
    },
    async listUnsubscribed() {
      if (!cfg.segmentId) return [];
      const out: string[] = [];
      let after: string | undefined;
      for (let page = 0; page < 200; page++) {
        const q = new URLSearchParams({ limit: "100", segment_id: cfg.segmentId, ...(after ? { after } : {}) });
        const res = await call("GET", `/contacts?${q}`);
        await ok(res, "list contacts");
        const body = (await res.json()) as { data?: { id: string; email: string; unsubscribed: boolean }[]; has_more?: boolean };
        const rows = body.data ?? [];
        for (const c of rows) if (c.unsubscribed) out.push(c.email);
        if (!body.has_more || !rows.length) break;
        after = rows[rows.length - 1]!.id;
      }
      return out;
    },
  };
}

/** Sends nothing; used when RESEND_API_KEY is unset. */
export const disabledMailer: Mailer = {
  enabled: false,
  async send() {},
  async addContact() {},
  async unsubscribeContact() {},
  async listUnsubscribed() { return []; },
};

/** Records everything, for tests. */
export function recordingMailer(opts: { failSend?: boolean; failContact?: boolean; remoteUnsubscribed?: string[] } = {}): Mailer & {
  sent: OutgoingEmail[];
  contacts: string[];
  unsubscribed: string[];
} {
  const sent: OutgoingEmail[] = [];
  const contacts: string[] = [];
  const unsubscribed: string[] = [];
  return {
    enabled: true,
    sent,
    contacts,
    unsubscribed,
    async send(msg) {
      if (opts.failSend) throw new Error("send failed");
      sent.push(msg);
    },
    async addContact(email) {
      if (opts.failContact) throw new Error("contact failed");
      contacts.push(email);
    },
    async unsubscribeContact(email) { unsubscribed.push(email); },
    async listUnsubscribed() { return opts.remoteUnsubscribed ?? []; },
  };
}

export const DEFAULT_EMAIL_FROM = "LinuxStatistics <hello@linuxstatistics.com>";
export const DEFAULT_REPLY_TO = "hello@linuxstatistics.com";

const DEV_LINK_SECRET = "dev-only-email-link-secret";

/**
 * Sending needs both RESEND_API_KEY and EMAIL_LINK_SECRET (it signs the
 * unsubscribe links, so the API and the worker must share it). With either
 * missing, sending is off. Outside production a dev secret is used.
 */
export function emailConfigFromEnv(env: NodeJS.ProcessEnv = process.env, doFetch?: FetchLike): { mailer: Mailer; linkSecret: string | null; problem: string | null } {
  const prod = env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  const linkSecret = env.EMAIL_LINK_SECRET || (prod ? null : DEV_LINK_SECRET);
  if (!env.RESEND_API_KEY) return { mailer: disabledMailer, linkSecret, problem: prod ? "RESEND_API_KEY is not set: signups are collected, nothing is sent" : null };
  if (!linkSecret) return { mailer: disabledMailer, linkSecret: null, problem: "EMAIL_LINK_SECRET is not set: sending is off" };
  return { mailer: mailerFromEnv(env, doFetch), linkSecret, problem: null };
}

/** Mailer from the environment: Resend when RESEND_API_KEY is set, else disabled. */
export function mailerFromEnv(env: NodeJS.ProcessEnv = process.env, doFetch?: FetchLike): Mailer {
  if (!env.RESEND_API_KEY) return disabledMailer;
  return resendMailer(
    {
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM || DEFAULT_EMAIL_FROM,
      replyTo: env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
      segmentId: env.RESEND_SEGMENT_ID || undefined,
    },
    doFetch,
  );
}

// ---------------------------------------------------------------- templates

export interface LinkSet {
  /** Site origin, e.g. https://linuxstatistics.com */
  web: string;
  /** API origin for the one-click header, e.g. https://linuxstatistics.com */
  api: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RFC 8058 one-click unsubscribe headers plus the visible footer link. */
export function unsubscribeParts(links: LinkSet, unsubToken: string) {
  const page = `${links.web}/email/unsubscribe/?t=${encodeURIComponent(unsubToken)}`;
  const oneClick = `${links.api}/api/email-signups/unsubscribe/one-click?t=${encodeURIComponent(unsubToken)}`;
  return {
    page,
    headers: {
      "List-Unsubscribe": `<${oneClick}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

function layout(paragraphs: string[], button: { label: string; href: string }, unsubPage: string, why: string): { text: string; html: string } {
  const text = [
    ...paragraphs,
    `${button.label}: ${button.href}`,
    "",
    "--",
    why,
    `Unsubscribe: ${unsubPage}`,
    "LinuxStatistics, https://linuxstatistics.com",
  ].join("\n\n");
  const p = (s: string) => `<p style="margin:0 0 16px;font:16px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a">${esc(s)}</p>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff">
<div style="max-width:560px;margin:0 auto">
${paragraphs.map(p).join("\n")}
<p style="margin:24px 0"><a href="${esc(button.href)}" style="display:inline-block;padding:12px 20px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font:600 16px -apple-system,Segoe UI,Roboto,sans-serif">${esc(button.label)}</a></p>
<p style="margin:0 0 16px;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#555">If the button doesn't work, copy this link: <br><a href="${esc(button.href)}" style="color:#555;word-break:break-all">${esc(button.href)}</a></p>
<hr style="border:0;border-top:1px solid #ddd;margin:24px 0">
<p style="margin:0;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#777">${esc(why)} <a href="${esc(unsubPage)}" style="color:#777">Unsubscribe</a>. LinuxStatistics, <a href="https://linuxstatistics.com" style="color:#777">linuxstatistics.com</a></p>
</div></body></html>`;
  return { text, html };
}

/** "Confirm your email": new signups and re-subscribes. */
export function confirmEmail(to: string, confirmToken: string, unsubToken: string, links: LinkSet): OutgoingEmail {
  const confirmUrl = `${links.web}/email/confirm/?t=${encodeURIComponent(confirmToken)}`;
  const unsub = unsubscribeParts(links, unsubToken);
  const body = layout(
    [
      "Thanks for signing up for the State of Linux Distros, our monthly email about which distros are rising, new releases and what changed in the data.",
      "Please confirm your address so we know it's yours. The link works for 7 days.",
    ],
    { label: "Confirm my subscription", href: confirmUrl },
    unsub.page,
    "You got this because someone entered this address on linuxstatistics.com. If it wasn't you, ignore this email and you won't hear from us again.",
  );
  return { to, subject: "Confirm your email for LinuxStatistics", ...body, headers: unsub.headers };
}

/** Re-permission for addresses that signed up before confirmation existed. */
export function legacyConfirmEmail(to: string, confirmToken: string, unsubToken: string, links: LinkSet, kind: "ask" | "reminder"): OutgoingEmail {
  const confirmUrl = `${links.web}/email/confirm/?t=${encodeURIComponent(confirmToken)}`;
  const unsub = unsubscribeParts(links, unsubToken);
  const lead =
    kind === "ask"
      ? "You signed up for the State of Linux Distros email on linuxstatistics.com. We now ask everyone to confirm their address before we send anything."
      : "A reminder: we haven't heard back about the State of Linux Distros email you signed up for on linuxstatistics.com.";
  const body = layout(
    [lead, "If you'd still like the monthly email, confirm below. If not, do nothing: we'll remove your address in a few weeks and won't write again."],
    { label: "Yes, keep me on the list", href: confirmUrl },
    unsub.page,
    "You got this because this address signed up on linuxstatistics.com.",
  );
  const subject = kind === "ask" ? "Do you still want the LinuxStatistics email?" : "Last reminder: keep getting the LinuxStatistics email?";
  return { to, subject, ...body, headers: unsub.headers };
}
