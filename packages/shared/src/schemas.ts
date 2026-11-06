import { z } from "zod";
import { familySchema, distroStatusSchema } from "./families.js";

export const distroSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  family: familySchema,
  basedOnSlug: z.string().min(1).nullable().optional(),
  homepage: z.url().nullable().optional(),
  logoUrl: z.url().nullable().optional(),
  firstReleaseYear: z.number().int().min(1990).max(2100).nullable().optional(),
  status: distroStatusSchema.default("active"),
});
export type DistroInput = z.infer<typeof distroSchema>;

/** Where a popularity rank comes from. */
export const popularitySourceSchema = z.enum(["distrowatch"]);
export type PopularitySource = z.infer<typeof popularitySourceSchema>;
/** The source behind the main rank, "rising" and rank history. */
export const RANK_SOURCE: PopularitySource = "distrowatch";

export const popularitySnapshotSchema = z.object({
  source: popularitySourceSchema,
  distroSlug: z.string().min(1),
  capturedAt: z.iso.datetime(),
  rank: z.number().int().positive(),
  hitsPerDay: z.number().int().nonnegative(),
  period: z.string().min(1),
});
export type PopularitySnapshotInput = z.infer<typeof popularitySnapshotSchema>;

export const githubRepoSchema = z.object({
  distroSlug: z.string().min(1),
  repoFullName: z.string().regex(/^[^/]+\/[^/]+$/),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  openIssues: z.number().int().nonnegative(),
});
export type GithubRepoInput = z.infer<typeof githubRepoSchema>;

export const githubSnapshotSchema = z.object({
  repoFullName: z.string().regex(/^[^/]+\/[^/]+$/),
  capturedAt: z.iso.datetime(),
  stars: z.number().int().nonnegative(),
  commitsLast30d: z.number().int().nonnegative(),
  contributors: z.number().int().nonnegative(),
});
export type GithubSnapshotInput = z.infer<typeof githubSnapshotSchema>;

export const marketShareSchema = z.object({
  capturedAt: z.iso.datetime(),
  region: z.string().min(1),
  platform: z.enum(["linux", "windows", "macos", "other"]),
  sharePct: z.number().min(0).max(100),
});
export type MarketShareInput = z.infer<typeof marketShareSchema>;

export const ingestionSourceSchema = z.enum(["distrowatch", "statcounter", "github"]);
export type IngestionSource = z.infer<typeof ingestionSourceSchema>;

export const ingestionStatusSchema = z.enum(["running", "success", "failed"]);
export type IngestionStatus = z.infer<typeof ingestionStatusSchema>;
