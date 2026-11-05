import {
  pgTable,
  serial,
  text,
  integer,
  smallint,
  boolean,
  numeric,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const familyEnum = pgEnum("family", [
  "debian",
  "arch",
  "rpm",
  "independent",
  "gentoo",
  "slackware",
  "other",
]);

export const distroStatusEnum = pgEnum("distro_status", ["active", "discontinued"]);

export const distros = pgTable(
  "distros",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    family: familyEnum("family").notNull(),
    basedOnSlug: text("based_on_slug"),
    homepage: text("homepage"),
    logoUrl: text("logo_url"),
    firstReleaseYear: integer("first_release_year"),
    status: distroStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ familyIdx: index("distros_family_idx").on(t.family) }),
);

export const distrowatchSnapshots = pgTable(
  "distrowatch_snapshots",
  {
    id: serial("id").primaryKey(),
    distroId: integer("distro_id")
      .notNull()
      .references(() => distros.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    rank: integer("rank").notNull(),
    hitsPerDay: integer("hits_per_day").notNull(),
    period: text("period").notNull(),
  },
  (t) => ({
    dwDistroIdx: index("dw_distro_captured_idx").on(t.distroId, t.capturedAt),
    dwPeriodIdx: index("dw_period_captured_idx").on(t.period, t.capturedAt),
  }),
);

/**
 * Other names a distro is known by. `source = 'distrowatch'` maps DistroWatch's
 * key to our distro (the key is also our slug); `source = 'legacy'` keeps old
 * slugs resolvable after a rename.
 */
export const distroAliases = pgTable(
  "distro_aliases",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    alias: text("alias").notNull(),
    distroId: integer("distro_id")
      .notNull()
      .references(() => distros.id, { onDelete: "cascade" }),
  },
  (t) => ({ sourceAliasUniq: uniqueIndex("distro_aliases_source_alias_uniq").on(t.source, t.alias) }),
);

export const githubRepos = pgTable("github_repos", {
  id: serial("id").primaryKey(),
  distroId: integer("distro_id")
    .notNull()
    .references(() => distros.id, { onDelete: "cascade" }),
  repoFullName: text("repo_full_name").notNull().unique(),
  stars: integer("stars").notNull().default(0),
  forks: integer("forks").notNull().default(0),
  openIssues: integer("open_issues").notNull().default(0),
});

export const githubSnapshots = pgTable(
  "github_snapshots",
  {
    id: serial("id").primaryKey(),
    repoId: integer("repo_id")
      .notNull()
      .references(() => githubRepos.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    stars: integer("stars").notNull(),
    commitsLast30d: integer("commits_last_30d").notNull(),
    contributors: integer("contributors").notNull(),
  },
  (t) => ({ ghRepoIdx: index("gh_repo_captured_idx").on(t.repoId, t.capturedAt) }),
);

export const platformEnum = pgEnum("platform", ["linux", "windows", "macos", "other"]);

export const marketShare = pgTable(
  "market_share",
  {
    id: serial("id").primaryKey(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    region: text("region").notNull(),
    platform: platformEnum("platform").notNull(),
    sharePct: numeric("share_pct", { precision: 6, scale: 3 }).notNull(),
  },
  (t) => ({
    msIdx: index("market_share_idx").on(t.region, t.platform, t.capturedAt),
    msUniq: uniqueIndex("market_share_uniq").on(t.region, t.platform, t.capturedAt),
  }),
);

export const ingestionSourceEnum = pgEnum("ingestion_source", [
  "distrowatch",
  "statcounter",
  "github",
]);
export const ingestionStatusEnum = pgEnum("ingestion_status", [
  "running",
  "success",
  "failed",
]);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: serial("id").primaryKey(),
  source: ingestionSourceEnum("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: ingestionStatusEnum("status").notNull().default("running"),
  error: text("error"),
  rowsWritten: integer("rows_written").notNull().default(0),
});

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const authProviderEnum = pgEnum("auth_provider", ["github", "gitlab", "codeberg"]);
export const contributionSourceEnum = pgEnum("contribution_source", ["user"]);
export const contributionStatusEnum = pgEnum("contribution_status", [
  "visible",
  "hidden",
  "removed",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    provider: authProviderEnum("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    username: text("username").notNull(),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull().default("user"),
    // Source-forge account creation time, captured at signup; powers the account-age gate.
    accountCreatedAt: timestamp("account_created_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerIdentityUniq: uniqueIndex("users_provider_identity_uniq").on(
      t.provider,
      t.providerUserId,
    ),
  }),
);

export const distroContributions = pgTable(
  "distro_contributions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    distroId: integer("distro_id")
      .notNull()
      .references(() => distros.id, { onDelete: "cascade" }),
    rating: smallint("rating"), // nullable; 1..5 enforced by check
    usesIt: boolean("uses_it").notNull().default(false),
    reviewBody: text("review_body"),
    source: contributionSourceEnum("source").notNull().default("user"),
    status: contributionStatusEnum("status").notNull().default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userDistroUniq: uniqueIndex("contrib_user_distro_uniq").on(t.userId, t.distroId),
    distroStatusIdx: index("contrib_distro_status_idx").on(t.distroId, t.status),
    ratingRange: check(
      "contrib_rating_range",
      sql`${t.rating} is null or (${t.rating} >= 1 and ${t.rating} <= 5)`,
    ),
  }),
);

export const emailSignups = pgTable("email_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const suggestionStatusEnum = pgEnum("suggestion_status", ["new", "done", "dismissed"]);

/** Visitor suggestions (add a distro, correct data, ideas), reviewed by admins. */
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  email: text("email"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  status: suggestionStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
