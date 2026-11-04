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
