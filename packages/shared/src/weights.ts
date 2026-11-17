/**
 * Weights of our composite rank index. Changing them changes the chart: do it in
 * a reviewed commit, with a "method" entry in the site changelog (a test checks).
 */
export const COMPOSITE_WEIGHTS = {
  /** English Wikipedia article views per day, last 12 months (our "interest" index). */
  interest: 0.5,
  /** DistroWatch 12-month page-hit rank, a small credited input while our own signals grow. */
  distrowatch: 0.3,
  /** GitHub stars of the main repo, for distros with one. */
  github: 0.1,
  /** Views of the distro's page on this site over the last 90 days. */
  siteViews: 0.1,
} as const;

export type CompositeInput = keyof typeof COMPOSITE_WEIGHTS;
