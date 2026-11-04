import type { Family } from "@linux-statistics/shared";

export const FAMILY_COLORS: Record<Family, string> = {
  debian: "#d70a53",
  arch: "#1793d1",
  rpm: "#ee8800",
  independent: "#9b8cff",
  gentoo: "#b39ddb",
  slackware: "#6aa0ff",
  other: "#8a97a6",
};

export const FAMILY_LABELS: Record<Family, string> = {
  debian: "Debian",
  arch: "Arch",
  rpm: "RPM",
  independent: "Independent",
  gentoo: "Gentoo",
  slackware: "Slackware",
  other: "Other",
};

export function familyColor(family: Family): string {
  return FAMILY_COLORS[family] ?? FAMILY_COLORS.other;
}
