/**
 * Article topics, in display order. Each topic is a hub at /articles/<slug>/ that
 * sits next to the site pages for the same readers. Adding a topic is one entry
 * here; articles name exactly one main topic and up to two more in `alsoIn`.
 */
export interface ArticleTopic {
  slug: string;
  name: string;
  /** One or two sentences at the top of the hub. */
  intro: string;
  /** Existing pages for the same readers, shown as "Start here" on the hub. */
  related: { label: string; href: string }[];
}

export const ARTICLE_TOPICS = [
  {
    slug: "beginners",
    name: "Beginners and switching",
    intro: "Moving to Linux from Windows or a Mac: what to pick, what changes, and how to try it safely first.",
    related: [
      { label: "Best Linux for beginners", href: "/best/beginners/" },
      { label: "Switch to Linux", href: "/switch/" },
      { label: "How to verify a download", href: "/guides/verify-download/" },
    ],
  },
  {
    slug: "hardware",
    name: "Hardware",
    intro: "Linux on older computers, low-memory machines, laptops and Raspberry Pi boards.",
    related: [
      { label: "Best Linux for old laptops", href: "/best/old-laptop/" },
      { label: "Best Linux for 2 GB of RAM or less", href: "/best/low-ram/" },
      { label: "Best Linux for Raspberry Pi", href: "/best/raspberry-pi/" },
      { label: "Best Linux for laptops", href: "/best/laptops/" },
    ],
  },
  {
    slug: "gaming",
    name: "Gaming",
    intro: "Playing games on Linux: distros, drivers, Steam and Proton, and what the numbers say.",
    related: [
      { label: "Best Linux for gaming", href: "/best/gaming/" },
      { label: "Best Linux for NVIDIA graphics cards", href: "/best/nvidia/" },
    ],
  },
  {
    slug: "privacy",
    name: "Privacy",
    intro: "What Linux distros send home, how to turn it off, and distros built around privacy.",
    related: [
      { label: "Best Linux for privacy", href: "/best/privacy/" },
      { label: "Linux distro telemetry", href: "/telemetry/" },
    ],
  },
  {
    slug: "servers",
    name: "Servers and homelab",
    intro: "Home servers, NAS boxes and self-hosting: Proxmox, TrueNAS, Unraid and the distros underneath.",
    related: [
      { label: "Best Linux for a home server", href: "/best/home-server/" },
      { label: "Linux support dates", href: "/support-dates/" },
    ],
  },
  {
    slug: "data",
    name: "Data and method",
    intro: "Analysis built on our own Linux distro numbers: rankings, interest and switching, and how we measure them.",
    related: [
      { label: "How we rank distros", href: "/about/#ranking" },
      { label: "Changelog", href: "/changelog/" },
      { label: "Open data", href: "/data/" },
      { label: "Linux by the numbers", href: "/stats/" },
    ],
  },
] as const satisfies readonly ArticleTopic[];

export type TopicSlug = (typeof ARTICLE_TOPICS)[number]["slug"];
export const TOPIC_SLUGS = ARTICLE_TOPICS.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]];
export const topicBySlug = (slug: string): ArticleTopic | undefined => ARTICLE_TOPICS.find((t) => t.slug === slug);

export const ARTICLE_TYPES = ["analysis", "qa", "guide"] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];
export const TYPE_LABEL: Record<ArticleType, string> = { analysis: "Analysis", qa: "Q&A", guide: "Guide" };

/** Which article topic each /best/ page belongs to, for its "Latest articles" box. */
export const BEST_TO_TOPIC: Record<string, TopicSlug> = {
  beginners: "beginners",
  laptops: "hardware",
  "old-laptop": "hardware",
  "low-ram": "hardware",
  "raspberry-pi": "hardware",
  gaming: "gaming",
  nvidia: "gaming",
  privacy: "privacy",
  "home-server": "servers",
};

/** A hub goes live (indexed, linked) at this many published articles. */
export const MIN_HUB_ARTICLES = 3;
/** A guide's steps should be rechecked after this many months (check-site warns). */
export const GUIDE_STALE_MONTHS = 6;
