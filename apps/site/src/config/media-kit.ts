/**
 * Public media-kit facts for /sponsors/. Fill the numbers from analytics once
 * the site is live; null hides a row. Round generously (nearest 100 or 1k).
 * Rates are quoted by email, not published here.
 */
export type TierId = "headline" | "guide" | "supporter";

export interface SponsorTierInfo {
  id: TierId;
  name: string;
  /** How many sponsors can hold this tier at once. */
  slots: number;
  /** One sentence: who sees it. */
  summary: string;
  /** What the sponsor gets, one item per line. */
  includes: string[];
  /** Visitors per month at which the tier goes on sale; null = on sale now. */
  opensAtMonthlyVisitors: number | null;
}

export const mediaKit = {
  /** Month the figures below describe, e.g. "October 2026"; null = no figures yet. */
  period: null as string | null,
  monthlyVisitors: null as number | null,
  monthlyPageViews: null as number | null,
  /** Email subscribers, rounded. */
  subscribers: null as number | null,
  /** Top visitor countries, most first, e.g. ["United States", "Germany", "India"]. */
  topCountries: [] as string[],
  offer: {
    minimumMonths: 3,
    tiers: [
      {
        id: "headline",
        name: "Headline",
        slots: 1,
        summary: "The main placement, seen on every page of the site.",
        includes: [
          "Sidebar card on every page, with your logo, one line and a link",
          "The sponsor spot in the footer",
          "A line in the monthly State of Linux Distros email",
          "A post on our social accounts during your term",
        ],
        opensAtMonthlyVisitors: null,
      },
      {
        id: "guide",
        name: "Guide",
        slots: 1,
        summary: "Reach people at the moment they're about to install Linux.",
        includes: ["Sidebar card on the quiz, Switch and Getting started pages"],
        opensAtMonthlyVisitors: 10_000,
      },
      {
        id: "supporter",
        name: "Supporter",
        slots: 6,
        summary: "Back an independent Linux site and get credited for it.",
        includes: ["Your logo and link in the \"Supported by\" row on every page and on this page"],
        opensAtMonthlyVisitors: null,
      },
    ] satisfies SponsorTierInfo[],
  },
};
