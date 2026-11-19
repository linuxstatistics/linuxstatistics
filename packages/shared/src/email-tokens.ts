import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** A random single-use token for a confirm link (32 bytes, URL-safe). */
export function newEmailToken(): string {
  return randomBytes(32).toString("base64url");
}

/** What the database stores for a confirm token; the token itself is only in the email. */
export function hashEmailToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Unsubscribe token: the address plus an HMAC of it, so links in old emails
 * keep working without storing anything. The secret is EMAIL_LINK_SECRET.
 */
export function unsubscribeToken(email: string, secret: string): string {
  const addr = Buffer.from(email.trim().toLowerCase()).toString("base64url");
  return `${addr}.${sign(addr, secret)}`;
}

/** The address an unsubscribe token belongs to, or null if it was altered. */
export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const addr = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(sign(addr, secret));
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;
  const email = Buffer.from(addr, "base64url").toString("utf8");
  return email.includes("@") ? email : null;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", `unsubscribe:${secret}`).update(value).digest("base64url");
}
