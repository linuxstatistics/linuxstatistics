import { and, desc, eq, ne, sql } from "drizzle-orm";
import { smoothedScore, type AuthProvider } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import { distroContributions, distros, moderationLog, users } from "./schema.js";

export type { AuthProvider } from "@linux-statistics/shared";

export interface UserProfileInput {
  provider: AuthProvider;
  providerUserId: string;
  username: string;
  avatarUrl: string | null;
  accountCreatedAt: Date | null;
}

export interface UserRow {
  id: number;
  provider: AuthProvider;
  providerUserId: string;
  username: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  accountCreatedAt: Date | null;
}

/** Insert or update a user by (provider, provider_user_id). Returns the row. */
export async function upsertUser(db: Database, p: UserProfileInput): Promise<UserRow> {
  const set = {
    username: p.username,
    avatarUrl: p.avatarUrl,
    accountCreatedAt: p.accountCreatedAt,
  };
  const [row] = await db
    .insert(users)
    .values({ provider: p.provider, providerUserId: p.providerUserId, ...set })
    .onConflictDoUpdate({ target: [users.provider, users.providerUserId], set })
    .returning();
  return row as UserRow;
}

export async function setUserRole(db: Database, id: number, role: "user" | "admin"): Promise<void> {
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function findUserById(db: Database, id: number): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return (row as UserRow) ?? null;
}

export interface ContributionInput {
  userId: number;
  distroId: number;
  rating: number | null;
  usesIt: boolean;
  reviewBody: string | null;
}

export interface ContributionRow {
  id: number;
  userId: number;
  distroId: number;
  rating: number | null;
  usesIt: boolean;
  reviewBody: string | null;
  status: "visible" | "hidden" | "removed";
}

/**
 * Upsert the caller's single contribution for a distro. Re-activates it if the
 * user had removed it; a contribution an admin hid stays hidden when edited.
 */
export async function upsertContribution(
  db: Database,
  c: ContributionInput,
): Promise<ContributionRow> {
  const set = {
    rating: c.rating,
    usesIt: c.usesIt,
    reviewBody: c.reviewBody,
    status: "visible" as const,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(distroContributions)
    .values({ userId: c.userId, distroId: c.distroId, ...set })
    .onConflictDoUpdate({
      target: [distroContributions.userId, distroContributions.distroId],
      set: { ...set, status: sql`case when ${distroContributions.status} = 'hidden' then 'hidden'::contribution_status else 'visible'::contribution_status end` },
    })
    .returning();
  return row as ContributionRow;
}

/** Soft-remove the caller's contribution (kept for audit; excluded from aggregates). */
export async function softRemoveContribution(
  db: Database,
  userId: number,
  distroId: number,
): Promise<void> {
  await db
    .update(distroContributions)
    .set({ status: "removed", updatedAt: new Date() })
    .where(and(eq(distroContributions.userId, userId), eq(distroContributions.distroId, distroId)));
}

export async function getMyContribution(
  db: Database,
  userId: number,
  distroId: number,
): Promise<ContributionRow | null> {
  const [row] = await db
    .select()
    .from(distroContributions)
    .where(
      and(
        eq(distroContributions.userId, userId),
        eq(distroContributions.distroId, distroId),
        ne(distroContributions.status, "removed"),
      ),
    );
  return (row as ContributionRow) ?? null;
}

export interface ContributionAggregate {
  /** Smoothed (Bayesian) score toward the site-wide mean; null with no ratings. */
  average: number | null;
  /** Number of counted star ratings (the "n" in "★ 4.2 (n)"). */
  count: number;
  /** Plain mean of counted ratings; null with no ratings. */
  mean: number | null;
  /** Counted ratings from verified (forge) accounts. */
  verifiedCount: number;
  usesItCount: number;
}

/**
 * Per-distro aggregates over visible rows only (DEC-0014). Every current
 * account signs in through a forge (GitHub, GitLab, Codeberg), so all ratings
 * count as verified; email accounts (specs/007) will add a pending state.
 * Distros with no visible rows are absent.
 */
export async function getContributionAggregates(
  db: Database,
): Promise<Map<number, ContributionAggregate>> {
  const rows = (await db
    .select()
    .from(distroContributions)
    .where(eq(distroContributions.status, "visible"))) as ContributionRow[];
  const byDistro = new Map<number, { sum: number; ratings: number; verified: number; uses: number }>();
  let siteSum = 0;
  let siteN = 0;
  for (const r of rows) {
    const acc = byDistro.get(r.distroId) ?? { sum: 0, ratings: 0, verified: 0, uses: 0 };
    if (r.rating != null) {
      acc.sum += r.rating;
      acc.ratings += 1;
      acc.verified += 1;
      siteSum += r.rating;
      siteN += 1;
    }
    if (r.usesIt) acc.uses += 1;
    byDistro.set(r.distroId, acc);
  }
  const siteMean = siteN ? siteSum / siteN : 0;
  const out = new Map<number, ContributionAggregate>();
  for (const [distroId, a] of byDistro) {
    out.set(distroId, {
      average: smoothedScore(a.sum, a.ratings, siteMean),
      count: a.ratings,
      mean: a.ratings ? a.sum / a.ratings : null,
      verifiedCount: a.verified,
      usesItCount: a.uses,
    });
  }
  return out;
}

/** Admin: list contributions, optionally filtered by status. */
export async function listContributions(
  db: Database,
  status?: "visible" | "hidden" | "removed",
): Promise<ContributionRow[]> {
  const base = db.select().from(distroContributions);
  const rows = status
    ? await base.where(eq(distroContributions.status, status))
    : await base;
  return rows as ContributionRow[];
}

/**
 * Admin moderation, hide only (owner decision): hide needs a reason, unhide
 * restores it. Both are logged. A contribution the user removed can't be
 * hidden or unhidden. Returns false when there's nothing to change.
 */
export async function moderateContribution(
  db: Database,
  id: number,
  action: "hide" | "unhide",
  adminId: number,
  reason?: string,
): Promise<boolean> {
  const why = reason?.trim();
  if (action === "hide" && !why) throw new Error("reason_required");
  const from = action === "hide" ? "visible" : "hidden";
  const now = new Date();
  const rows = await db
    .update(distroContributions)
    .set(
      action === "hide"
        ? { status: "hidden", hiddenAt: now, hiddenReason: why!, hiddenBy: adminId, updatedAt: now }
        : { status: "visible", updatedAt: now },
    )
    .where(and(eq(distroContributions.id, id), eq(distroContributions.status, from)))
    .returning({ id: distroContributions.id });
  if (!rows.length) return false;
  await db.insert(moderationLog).values({ contributionId: id, action, reason: why ?? null, adminId, at: now });
  return true;
}

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

/** Admin: newest ratings and reviews (user-removed ones left out), with author details for judging trust. */
export async function listForModeration(db: Database, status?: "visible" | "hidden", limit = 200): Promise<ModerationRow[]> {
  const rows = await db
    .select({
      id: distroContributions.id,
      slug: distros.slug,
      name: distros.name,
      username: users.username,
      provider: users.provider,
      accountCreatedAt: users.accountCreatedAt,
      joinedAt: users.createdAt,
      rating: distroContributions.rating,
      usesIt: distroContributions.usesIt,
      reviewBody: distroContributions.reviewBody,
      status: distroContributions.status,
      createdAt: distroContributions.createdAt,
      updatedAt: distroContributions.updatedAt,
      hiddenAt: distroContributions.hiddenAt,
      hiddenReason: distroContributions.hiddenReason,
    })
    .from(distroContributions)
    .innerJoin(users, eq(users.id, distroContributions.userId))
    .innerJoin(distros, eq(distros.id, distroContributions.distroId))
    .where(status ? eq(distroContributions.status, status) : ne(distroContributions.status, "removed"))
    .orderBy(desc(distroContributions.updatedAt), desc(distroContributions.id))
    .limit(limit);
  const iso = (d: Date | null) => d?.toISOString() ?? null;
  return rows.map((r) => ({
    id: r.id,
    distro: { slug: r.slug, name: r.name },
    author: { username: r.username, provider: r.provider, accountCreatedAt: iso(r.accountCreatedAt), joinedAt: r.joinedAt.toISOString() },
    rating: r.rating,
    usesIt: r.usesIt,
    reviewBody: r.reviewBody,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    hiddenAt: iso(r.hiddenAt),
    hiddenReason: r.hiddenReason,
  }));
}
