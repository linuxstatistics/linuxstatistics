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
  /** Founding-sponsor offer: three tiers, prices in USD per month. */
  offer: {
    minimumMonths: 3,
    tiers: [
      {
        id: "headline",
        name: "Headline",
        slots: 1,
        priceUsdPerMonth: { from: 150, to: 300 },
        placement: "Sidebar card on every page, the footer spot, a line in the monthly email and one or two posts on our social accounts per term.",
        /** null = on sale now. */
        opensAtMonthlyVisitors: null as number | null,
      },
      {
        id: "guide",
        name: "Guide",
        slots: 1,
        priceUsdPerMonth: { from: 75, to: 150 },
        placement: "The sidebar card on the quiz, Switch and Getting started pages, where people are about to install Linux.",
        opensAtMonthlyVisitors: 10_000 as number | null,
      },
      {
        id: "supporter",
        name: "Supporter",
        slots: 6,
        priceUsdPerMonth: { from: 25, to: 50 },
        placement: "Your logo and link in the \"Supported by\" row in the footer of every page and on this page.",
        opensAtMonthlyVisitors: null as number | null,
      },
    ],
  },
};
