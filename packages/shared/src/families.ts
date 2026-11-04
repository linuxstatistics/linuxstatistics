import { z } from "zod";

export const FAMILIES = [
  "debian",
  "arch",
  "rpm",
  "independent",
  "gentoo",
  "slackware",
  "other",
] as const;

export const familySchema = z.enum(FAMILIES);
export type Family = z.infer<typeof familySchema>;

export const distroStatusSchema = z.enum(["active", "discontinued"]);
export type DistroStatus = z.infer<typeof distroStatusSchema>;

/** DistroWatch popularity periods, one table each on the ranking page. */
export const PERIODS = ["last-1-month", "last-3-months", "last-6-months", "last-12-months"] as const;
export const periodSchema = z.enum(PERIODS);
export type Period = z.infer<typeof periodSchema>;
/** The period used for the main ranking everywhere on the site. */
export const MAIN_PERIOD: Period = "last-12-months";
/** The period used for "rising" / trending signals. */
export const TRENDING_PERIOD: Period = "last-1-month";
