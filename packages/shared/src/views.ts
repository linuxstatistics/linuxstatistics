import { z } from "zod";
import { familySchema, distroStatusSchema } from "./families.js";

/**
 * API response DTOs (the contract between the API and the web app).
 * These are the *read* shapes the frontend consumes.
 */

export const userRatingSchema = z.object({
  // Smoothed (Bayesian) score: pulled toward the site-wide mean when a distro
  // has few ratings. null when the distro has no counted ratings.
  average: z.number().nullable(),
  count: z.number().int(),
  // Plain mean of the counted ratings, for transparency.
  mean: z.number().nullable(),
  // How many counted ratings come from verified (forge) accounts.
  verifiedCount: z.number().int(),
});
export type UserRating = z.infer<typeof userRatingSchema>;

export const contributionSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable(),
  usesIt: z.boolean(),
  reviewBody: z.string().max(1000).nullable(),
});
export type Contribution = z.infer<typeof contributionSchema>;

/**
 * Weight of the site-wide mean in the smoothed score: a distro's score is
 * (C·m + Σratings) / (C + n). With C = 5, a distro needs about five ratings
 * before its own ratings outweigh the site mean.
 */
export const RATING_PRIOR_WEIGHT = 5;

/** Smoothed score; null when there are no ratings. */
export function smoothedScore(sum: number, n: number, siteMean: number, c = RATING_PRIOR_WEIGHT): number | null {
  if (n === 0) return null;
  return (c * siteMean + sum) / (c + n);
}

export const authProviderSchema = z.enum(["github", "gitlab", "codeberg"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const meSchema = z.object({
  id: z.number().int(),
  provider: authProviderSchema,
  username: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.enum(["user", "admin"]),
});
export type Me = z.infer<typeof meSchema>;

export const providerSummarySchema = z.object({
  slug: z.string(),
  displayName: z.string(),
});
export type ProviderSummary = z.infer<typeof providerSummarySchema>;

export const distroListItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  family: familySchema,
  status: distroStatusSchema,
  rank: z.number().int().nullable(),
  hitsPerDay: z.number().int().nullable(),
  stars: z.number().int().nullable(),
  commitsLast30d: z.number().int().nullable(),
  firstReleaseYear: z.number().int().nullable(),
  // "owner/repo" when the distro has a tracked GitHub repo, else null.
  repoFullName: z.string().nullable(),
  // change in DistroWatch rank vs ~1 year ago (positive = improved). null if unknown.
  rankTrend: z.number().int().nullable(),
  // rank in DistroWatch's last-1-month table, and the climb vs the 12-month rank
  // (positive = rising). null when either rank is missing.
  rank1m: z.number().int().nullable(),
  rank1mDelta: z.number().int().nullable(),
  // first-party aggregates over visible user contributions
  userRating: userRatingSchema,
  usesItCount: z.number().int(),
});
export type DistroListItem = z.infer<typeof distroListItemSchema>;

export const timeSeriesPointSchema = z.object({
  capturedAt: z.string(),
  value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof timeSeriesPointSchema>;

export const distroDetailSchema = distroListItemSchema.extend({
  basedOnSlug: z.string().nullable(),
  homepage: z.string().nullable(),
  logoUrl: z.string().nullable(),
  firstReleaseYear: z.number().int().nullable(),
  repoFullName: z.string().nullable(),
  rankHistory: z.array(timeSeriesPointSchema),
  starsHistory: z.array(timeSeriesPointSchema),
  myContribution: contributionSchema.nullable(),
});
export type DistroDetail = z.infer<typeof distroDetailSchema>;

export const galaxyBodySchema = z.object({
  slug: z.string(),
  name: z.string(),
  family: familySchema,
  rank: z.number().int(),
  hitsPerDay: z.number().int(),
  stars: z.number().int().nullable(),
  // 0..1 normalized popularity for sizing in the 3D scene
  popularity: z.number().min(0).max(1),
});
export type GalaxyBody = z.infer<typeof galaxyBodySchema>;

export const galaxyPayloadSchema = z.object({
  sun: galaxyBodySchema, // rank #1
  planets: z.array(galaxyBodySchema), // ranks #2..#10
  starfield: z.array(galaxyBodySchema), // the long tail
});
export type GalaxyPayload = z.infer<typeof galaxyPayloadSchema>;

export const marketSharePointSchema = z.object({
  capturedAt: z.string(),
  region: z.string(),
  platform: z.enum(["linux", "windows", "macos", "other"]),
  sharePct: z.number(),
});
export type MarketSharePoint = z.infer<typeof marketSharePointSchema>;

export const sourceFreshnessSchema = z.object({
  source: z.enum(["distrowatch", "statcounter", "github"]),
  lastSuccessAt: z.string().nullable(),
  status: z.enum(["running", "success", "failed", "never"]),
});
export type SourceFreshness = z.infer<typeof sourceFreshnessSchema>;

export const metaSchema = z.object({
  trackedDistros: z.number().int(),
  sources: z.array(sourceFreshnessSchema),
});
export type Meta = z.infer<typeof metaSchema>;

export const emailSignupInputSchema = z.object({
  email: z.email().max(320),
  source: z.string().max(64).optional(),
});
export type EmailSignupInput = z.infer<typeof emailSignupInputSchema>;
