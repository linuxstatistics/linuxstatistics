import { rankAll, type Suggestion } from "./picker";
import type { Answers } from "./picker-questions";
import { PROFILES, type PickerProfile } from "./picker-profiles";

export interface BestTopic {
  slug: string;
  /** H1 and nav label, e.g. "Best Linux for gaming". */
  title: string;
  /** Short label for links. */
  label: string;
  /** Quiz answers this topic stands for: the same engine ranks it, so the page and the quiz agree. */
  answers: Answers;
  /** A profile counts as a real pick only if this holds (the tag the topic is about). */
  qualifies: (p: PickerProfile) => boolean;
  /** Who the page is for and what matters, one sentence; the direct answer is built from the picks. */
  lead: string;
  faq: { q: string; a: string }[];
  related: string[];
}

/** Below this many qualifying picks a topic page is built noindex and left out of the sitemap. */
export const MIN_PICKS = 5;
/** Picks shown per page. */
export const MAX_PICKS = 8;

export const BEST_TOPICS: BestTopic[] = [
  {
    slug: "beginners",
    title: "Best Linux for beginners",
    label: "Beginners",
    answers: { level: "new", use: "everyday", updates: "any" },
    qualifies: (p) => p.levels.includes("new"),
    lead: "For people new to Linux: a familiar desktop, tested updates and little setup.",
    faq: [
      { q: "Which Linux is easiest for a beginner?", a: "Pick a distro with fixed releases, a familiar desktop and a large community. The list on this page is ranked by our quiz engine for a first-time user with everyday needs." },
      { q: "Can I try Linux without installing it?", a: "Yes. Most beginner distros run from a USB stick as a live session, so you can check Wi-Fi, sound and graphics before changing anything." },
    ],
    related: ["old-laptop", "laptops", "gaming"],
  },
  {
    slug: "gaming",
    title: "Best Linux for gaming",
    label: "Gaming",
    answers: { use: "gaming", updates: "any" },
    qualifies: (p) => p.uses.includes("gaming"),
    lead: "For playing Steam and other PC games: current graphics drivers, Proton and gaming tools set up.",
    faq: [
      { q: "Can I play Windows games on Linux?", a: "Many, through Steam's Proton. Check each game on ProtonDB first; games with kernel-level anti-cheat often don't run." },
      { q: "Do I need a special distro for gaming?", a: "No, but gaming distros save setup: newer drivers, Steam and controller support out of the box." },
    ],
    related: ["nvidia", "beginners", "laptops"],
  },
  {
    slug: "nvidia",
    title: "Best Linux for NVIDIA graphics cards",
    label: "NVIDIA GPUs",
    answers: { gpu: "nvidia", updates: "any" },
    qualifies: (p) => p.nvidia === "excellent" || p.nvidia === "good",
    lead: "For computers with an NVIDIA card: drivers installed for you, or easy to add from the distro itself.",
    faq: [
      { q: "Does Linux work with NVIDIA cards?", a: "Yes. NVIDIA's own driver works on Linux; the difference between distros is whether it's installed for you or one step away." },
      { q: "What about older NVIDIA cards?", a: "GTX 10-series and older need NVIDIA's 580 legacy driver. Fixed-release distros keep it working longer than rolling ones." },
    ],
    related: ["gaming", "ai", "developers"],
  },
  {
    slug: "old-laptop",
    title: "Best Linux for old laptops",
    label: "Old laptops",
    answers: { use: "old-hw", ram: 4, updates: "any" },
    qualifies: (p) => p.uses.includes("old-hw"),
    lead: "For older computers: light desktops that stay quick on modest hardware.",
    faq: [
      { q: "Will Linux make an old laptop faster?", a: "Often, if you pick a light desktop. A modern browser still needs memory, so 4 GB is a comfortable minimum for everyday use." },
      { q: "Does my old laptop support 64-bit?", a: "Almost every laptop from 2008 on does. 32-bit-only machines need one of the few distros that still ship 32-bit images." },
    ],
    related: ["low-ram", "beginners", "raspberry-pi"],
  },
  {
    slug: "low-ram",
    title: "Best Linux for 2 GB of RAM or less",
    label: "Low RAM",
    answers: { ram: 1, updates: "any" },
    qualifies: (p) => p.minRamGb <= 1,
    lead: "For computers with 2 GB of memory or less: distros whose default desktop stays usable in 1 GB.",
    faq: [
      { q: "Can Linux run on 2 GB of RAM?", a: "Yes, with a light desktop such as Xfce, LXQt or a window manager. Web browsing is the hard part; keep few tabs open." },
      { q: "How much RAM does Linux need?", a: "The system itself needs well under 1 GB with a light desktop. What you run on top, mostly the browser, decides the rest." },
    ],
    related: ["old-laptop", "raspberry-pi", "home-server"],
  },
  {
    slug: "raspberry-pi",
    title: "Best Linux for Raspberry Pi",
    label: "Raspberry Pi",
    answers: { device: "pi", updates: "any" },
    qualifies: (p) => p.platforms.includes("pi"),
    lead: "For Raspberry Pi boards: distros with official Pi images.",
    faq: [
      { q: "What's the default OS for a Raspberry Pi?", a: "Raspberry Pi OS, made by Raspberry Pi itself. Others on this list publish their own Pi images." },
      { q: "How do I install Linux on a Raspberry Pi?", a: "Write the image to a microSD card or SSD with Raspberry Pi Imager, which lists several of these distros." },
    ],
    related: ["home-server", "low-ram", "developers"],
  },
  {
    slug: "developers",
    title: "Best Linux for developers",
    label: "Developers",
    answers: { use: "dev", level: "some", updates: "any" },
    qualifies: (p) => p.uses.includes("dev"),
    lead: "For writing software: current toolchains, good container support and a well-documented base.",
    faq: [
      { q: "Should developers use a rolling or fixed-release distro?", a: "Rolling releases get new compilers first; fixed releases change less under you. Containers make either work for most projects." },
      { q: "Is WSL enough instead?", a: "For many tasks, yes. Native Linux helps with hardware access, containers and anything performance-sensitive." },
    ],
    related: ["ai", "home-server", "nvidia"],
  },
  {
    slug: "home-server",
    title: "Best Linux for a home server",
    label: "Home servers",
    answers: { use: "server", updates: "stable" },
    qualifies: (p) => p.uses.includes("server"),
    lead: "For a NAS, media server or self-hosting box: long support, stable updates and good container support.",
    faq: [
      { q: "What's a good Linux for a home server?", a: "One with long support and few surprises. Many people run a minimal server install and put their apps in containers." },
      { q: "Do I need a desktop on a server?", a: "No. Most servers are managed over SSH or a web interface; skipping the desktop saves memory and updates." },
    ],
    related: ["raspberry-pi", "low-ram", "developers"],
  },
  {
    slug: "privacy",
    title: "Best Linux for privacy",
    label: "Privacy",
    answers: { use: "privacy", telemetry: "none", updates: "any" },
    qualifies: (p) => p.uses.includes("privacy"),
    lead: "For people who want less tracking: distros built around privacy, checked for what they send home.",
    faq: [
      { q: "Which Linux distros send no telemetry?", a: "Most send nothing by default. Our telemetry page lists every distro we checked, grouped by what it sends." },
      { q: "Is any Linux distro anonymous?", a: "Only purpose-built systems like Tails route everything through Tor. A normal distro protects you from vendor tracking, not from the websites you visit." },
    ],
    related: ["beginners", "developers", "home-server"],
  },
  {
    slug: "creative",
    title: "Best Linux for creative work",
    label: "Creative work",
    answers: { use: "creative", updates: "any" },
    qualifies: (p) => p.uses.includes("creative"),
    lead: "For music, video and graphics: distros that set up low-latency audio and ship creative tools.",
    faq: [
      { q: "Can you make music on Linux?", a: "Yes. Ardour, Bitwig and Reaper run on Linux, and creative distros set up low-latency audio for you." },
      { q: "Does Adobe run on Linux?", a: "No. Kdenlive, DaVinci Resolve, Krita, GIMP and Darktable are the common replacements." },
    ],
    related: ["nvidia", "developers", "gaming"],
  },
  {
    slug: "ai",
    title: "Best Linux for local AI and LLMs",
    label: "Local AI",
    answers: { use: "ai", gpu: "nvidia", updates: "any" },
    qualifies: (p) => p.uses.includes("ai"),
    lead: "For running models on your own GPU: distros with official CUDA or ROCm support.",
    faq: [
      { q: "Which Linux is best for running LLMs locally?", a: "One that NVIDIA's CUDA or AMD's ROCm officially supports, so drivers and toolkits install from their repositories without workarounds." },
      { q: "How much GPU memory do I need?", a: "It depends on the model size and quantization. Check the model's requirements; the distro doesn't change that." },
    ],
    related: ["nvidia", "developers", "gaming"],
  },
  {
    slug: "laptops",
    title: "Best Linux for laptops",
    label: "Laptops",
    answers: { level: "some", use: "everyday", updates: "any" },
    qualifies: (p) => p.laptop != null,
    lead: "For laptops: distros a laptop maker ships preinstalled or certifies, so suspend, battery and Wi-Fi are tested.",
    faq: [
      { q: "Which laptops come with Linux?", a: "System76, TUXEDO, Framework, Slimbook and others sell laptops with Linux preinstalled or officially supported. Each pick here names its vendor." },
      { q: "Will Linux run on my current laptop?", a: "Usually. Try a live USB first and check Wi-Fi, sleep, the webcam and the touchpad before installing." },
    ],
    related: ["beginners", "gaming", "developers"],
  },
];

export interface BestPick extends Suggestion {
  qualifies: boolean;
}

/**
 * A topic's picks from the quiz engine: only profiles the topic is really about,
 * best first, at most MAX_PICKS. Pure: no I/O.
 */
export function bestPicks(topic: BestTopic, profiles: PickerProfile[], rankOf: (key: string) => number | null): BestPick[] {
  const byKey = new Map(profiles.map((p) => [p.key, p]));
  return rankAll(topic.answers, profiles, rankOf)
    .filter((s) => topic.qualifies(byKey.get(s.key)!))
    .slice(0, MAX_PICKS)
    .map((s) => ({ ...s, qualifies: true }));
}

export const isIndexable = (picks: BestPick[]) => picks.length >= MIN_PICKS;

export const topicBySlug = (slug: string) => BEST_TOPICS.find((t) => t.slug === slug);

/** Indexable topics a distro is a pick for, best placement first (for links from its page). */
export function topicsFor(slug: string, profiles: PickerProfile[], rankOf: (key: string) => number | null): { topic: BestTopic; place: number }[] {
  return topicIndex(profiles, rankOf).get(slug) ?? [];
}

let cached: { profiles: PickerProfile[]; index: Map<string, { topic: BestTopic; place: number }[]> } | null = null;

/** slug -> topics, built once per profile list (pages call this for every distro). */
export function topicIndex(profiles: PickerProfile[], rankOf: (key: string) => number | null) {
  if (cached && cached.profiles.length === profiles.length && cached.profiles.every((p, i) => p === profiles[i])) return cached.index;
  const index = new Map<string, { topic: BestTopic; place: number }[]>();
  for (const t of BEST_TOPICS) {
    const picks = bestPicks(t, profiles, rankOf);
    if (!isIndexable(picks)) continue;
    picks.forEach((p, i) => index.set(p.key, [...(index.get(p.key) ?? []), { topic: t, place: i + 1 }]));
  }
  for (const v of index.values()) v.sort((a, b) => a.place - b.place);
  cached = { profiles, index };
  return index;
}

let listedCache: { key: Map<string, number | null>; out: PickerProfile[] } | null = null;
/** PROFILES limited to listed distros, the same array for the same list (keeps topicIndex cached). */
export function listedProfiles(listed: Map<string, number | null>): PickerProfile[] {
  if (listedCache && listedCache.key.size === listed.size && [...listed.keys()].every((k) => listedCache!.key.has(k))) return listedCache.out;
  const out = PROFILES.filter((p) => listed.has(p.key));
  listedCache = { key: listed, out };
  return out;
}
