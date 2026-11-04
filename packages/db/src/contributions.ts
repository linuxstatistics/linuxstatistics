import { and, eq, ne } from "drizzle-orm";
import { MIN_PUBLIC_RATINGS, type AuthProvider } from "@linux-statistics/shared";
import type { Database } from "./client.js";
import { distroContributions, users } from "./schema.js";

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

/** Upsert the caller's single contribution for a distro. Re-activates if previously removed. */
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
      set,
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
  /** Mean of star ratings, or null when fewer than MIN_PUBLIC_RATINGS exist. */
  average: number | null;
  /** Number of star ratings (the "n" in "★ 4.2 (n)"). */
  count: number;
  usesItCount: number;
}

/** Per-distro aggregates over visible rows only. Distros with no visible rows are absent. */
export async function getContributionAggregates(
  db: Database,
): Promise<Map<number, ContributionAggregate>> {
  const rows = await db
    .select()
    .from(distroContributions)
    .where(eq(distroContributions.status, "visible"));
  const byDistro = new Map<number, { sum: number; ratings: number; count: number; uses: number }>();
  for (const r of rows as ContributionRow[]) {
    const acc = byDistro.get(r.distroId) ?? { sum: 0, ratings: 0, count: 0, uses: 0 };
    acc.count += 1;
    if (r.rating != null) {
      acc.sum += r.rating;
      acc.ratings += 1;
    }
    if (r.usesIt) acc.uses += 1;
    byDistro.set(r.distroId, acc);
  }
  const out = new Map<number, ContributionAggregate>();
  for (const [distroId, a] of byDistro) {
    out.set(distroId, {
      // Withhold the average until enough ratings exist so one rater can't define a score.
      average: a.ratings >= MIN_PUBLIC_RATINGS ? a.sum / a.ratings : null,
      count: a.ratings,
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

/** Admin: set a contribution's moderation status by id. */
export async function setContributionStatusById(
  db: Database,
  id: number,
  status: "visible" | "hidden" | "removed",
): Promise<void> {
  await db
    .update(distroContributions)
    .set({ status, updatedAt: new Date() })
    .where(eq(distroContributions.id, id));
}
