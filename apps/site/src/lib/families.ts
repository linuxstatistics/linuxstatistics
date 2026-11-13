import type { Family } from "@linux-statistics/shared";

/**
 * Family colours are CSS variables (`--fam-<family>` in styles.css), with a lighter
 * shade for the dark theme and a darker one for light, so labels pass WCAG AA
 * (4.5:1) on the page background in both themes.
 */
export const FAMILY_COLORS: Record<Family, string> = {
  debian: "var(--fam-debian)",
  arch: "var(--fam-arch)",
  rpm: "var(--fam-rpm)",
  independent: "var(--fam-independent)",
  gentoo: "var(--fam-gentoo)",
  slackware: "var(--fam-slackware)",
  other: "var(--fam-other)",
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
