/**
 * ADMIN_USERS: comma-separated sign-in identities that get the admin role
 * when they sign in, e.g. "github:#226349, gitlab:chris".
 *   provider:#<id>   matches the provider's numeric account id (safest: never changes)
 *   provider:<name>  matches the username, case-insensitive
 * When ADMIN_USERS is set it is the source of truth: matching accounts are made
 * admin and other admins are demoted at their next sign-in.
 */
export interface Identity {
  provider: string;
  providerUserId: string;
  username: string;
}

export interface AdminEntry {
  provider: string;
  id?: string;
  name?: string;
}

export function parseAdminUsers(raw: string | undefined): AdminEntry[] {
  if (!raw) return [];
  const out: AdminEntry[] = [];
  for (const part of raw.split(",")) {
    const entry = part.trim();
    const i = entry.indexOf(":");
    if (i <= 0) continue;
    const provider = entry.slice(0, i).toLowerCase();
    const who = entry.slice(i + 1).trim();
    if (!who) continue;
    out.push(who.startsWith("#") ? { provider, id: who.slice(1) } : { provider, name: who.toLowerCase() });
  }
  return out;
}

/** null when ADMIN_USERS isn't set (leave roles alone); otherwise whether this identity is listed. */
export function adminFromEnv(u: Identity, raw = process.env.ADMIN_USERS): boolean | null {
  const list = parseAdminUsers(raw);
  if (list.length === 0) return null;
  return list.some(
    (a) => a.provider === u.provider && (a.id ? a.id === u.providerUserId : a.name === u.username.toLowerCase()),
  );
}
