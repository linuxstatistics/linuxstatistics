/**
 * Public media-kit facts for /sponsors/. Fill the numbers from analytics once
 * the site is live; null hides a row. Round generously (nearest 100 or 1k).
 */
export const mediaKit = {
  /** Month the figures below describe, e.g. "October 2026"; null = no figures yet. */
  period: null as string | null,
  monthlyVisitors: null as number | null,
  monthlyPageViews: null as number | null,
  /** Email subscribers, rounded. */
  subscribers: null as number | null,
  /** Top visitor countries, most first, e.g. ["United States", "Germany", "India"]. */
  topCountries: [] as string[],
  /** Founding-sponsor offer. */
  offer: {
    priceUsdPerMonth: { from: 150, to: 500 },
    minimumMonths: 3,
    slots: 1,
  },
};
