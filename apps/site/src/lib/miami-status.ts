/**
 * Where PC and Linux stand for GTA VI, kept by hand. Every ledger entry rests on a page we opened;
 * re-read them, and add dated rows, when STATUS_REVIEWED gets old.
 *
 * Link policy: we link to Rockstar and to press reporting, never to a project's code, chat server,
 * mirror, tracker or anything that explains how to get or run a leaked build. Claims that only appear
 * in project notes are listed as unverified text, without a link. Project names stay out of this file.
 */
import { ANTI_CHEAT_LINKS } from "./hardware-notes";

/**
 * The only hosts an official or press entry may link to. Add an outlet here only after checking it is
 * reputable press; the tests fail for any other host, so a mislabeled entry cannot slip through.
 */
export const ALLOWED_SOURCE_HOSTS = ["rockstargames.com", "notebookcheck.net", "decrypt.co", "xda-developers.com", "videocardz.com", "tweaktown.com", "techradar.com"] as const;

export const STATUS_REVIEWED = "2026-11-25";

/** When the page first went up (YYYY-MM-DD). */
export const MIAMI_PUBLISHED = "2026-11-24";

/** The answer shown first on the page, 40 to 60 words so it can be quoted whole. Keep it in step with the status board. */
export const MIAMI_ANSWER =
  "GTA VI is out on PS5 and Xbox Series X|S only. Rockstar hasn't announced a PC version or PC requirements, so nothing official runs on Linux yet. Below, we compare your PC with Red Dead Redemption 2's requirements and with our estimates for the PS5, Xbox Series X and Series S, and show what's confirmed and what's only reported.";

/** After this many days without a review the page says it may be out of date. */
export const STATUS_STALE_DAYS = 14;

export type EvidenceKind = "official" | "press" | "community";
export type Confidence = "confirmed" | "reported" | "unverified";

export interface Evidence {
  id: string;
  /** YYYY-MM-DD: the source's own date. */
  date: string;
  track: "official" | "community";
  /** What was reported, in our own words. */
  text: string;
  kind: EvidenceKind;
  /** "confirmed" is only for an official source. */
  confidence: Confidence;
  /** Matters to someone running Linux. */
  linux: boolean;
  /** Community claims carry no link. Official and press entries must. */
  source: { name: string; href?: string };
  /** Short label for the status board's "Sources" line. */
  short: string;
}

/** Newest first. */
export const EVIDENCE: readonly Evidence[] = [
  {
    id: "press-2026-11-25-chapter-one-playable",
    date: "2026-11-25",
    track: "community",
    text: "Press reports that some unofficial PC projects now seem to have the opening chapter playable, including driving around the first area, but only at a few frames per second. The outlet says a stable, acceptable port is a different matter and that any playable version soon would likely be rough, with bugs and crashes. It also relays reports that Take-Two is sending takedown notices to some of these projects and to some social posts showing footage, without official confirmation.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "TechRadar",
      href: "https://www.techradar.com/gaming/the-very-unofficial-gta-6-pc-ports-are-speeding-ahead-with-chapter-1-seemingly-now-playable-but-rockstar-is-rumored-to-be-playing-whack-a-mole-with-these-projects",
    },
    short: "TechRadar",
  },
  {
    id: "press-2026-11-25-new-leader-open-world",
    date: "2026-11-25",
    track: "community",
    text: "Press reports that a new open-source project appears to have taken the lead among unofficial PC efforts. It reportedly boots the leaked console build and draws most of the in-game graphics, including the open world, vehicles and pedestrians, at single-digit frame rates, and has been tested only on a Windows PC with an AMD graphics card. The outlet says it is nowhere near playable and that using this and similar projects means supplying the leaked files, since console owners can't currently extract their own copy.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "XDA",
      href: "https://www.xda-developers.com/new-frontrunner-race-to-unofficially-bring-gta6-to-pc-already-hitting-5-7fps/",
    },
    short: "XDA (Nov 25)",
  },
  {
    id: "press-2026-11-25-takedown-notice",
    date: "2026-11-25",
    track: "community",
    text: "Press reports that Take-Two filed a copyright takedown notice against the largest unofficial PC effort, and that the code-hosting site applied it to the project's whole network of about 3,000 copies. Take-Two argues the project is a derivative work that breaks Rockstar's ban on reverse engineering, and calls its \"bring your own files\" line misleading because the only files available are the leaked ones. Other projects were still online at the time.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "TweakTown",
      href: "https://www.tweaktown.com/news/114877/gta-6-pc-port-takedown-confirmed-take-two-cites-rockstars-ban-on-reverse-engineering/index.html",
    },
    short: "TweakTown",
  },
  {
    id: "press-2026-11-24-in-game-rendering",
    date: "2026-11-24",
    track: "community",
    text: "Press reports that an unofficial PC project, built on a translation layer for Xbox games, shows the leaked console build booting, loading its menus and drawing its first 3D scenes, based on footage shared from livestreams. The outlet says no verified public build shows the game fully playable, and that Xbox owners have no known way to extract their own copy of the game, so anyone trying it would depend on leaked files.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "VideoCardz",
      href: "https://videocardz.com/newz/gta-6-pc-project-reportedly-reaches-in-game-rendering",
    },
    short: "VideoCardz",
  },
  {
    id: "press-2026-11-24-low-fps-build",
    date: "2026-11-24",
    track: "community",
    text: "Press reports that an unofficial effort has booted the leaked console build on PC and renders basic in-game visuals at a very poor frame rate, and that a private group may be slightly further along. The outlet has not verified the clips. The effort reportedly translates the console's shaders for Direct3D 12 rather than Vulkan.",
    kind: "press",
    confidence: "reported",
    linux: true,
    source: {
      name: "XDA",
      href: "https://www.xda-developers.com/unofficial-gta-6-pc-port-making-progress-developers-have-first-in-game-visuals/",
    },
    short: "XDA",
  },
  {
    id: "press-2026-11-24-effort-offline",
    date: "2026-11-24",
    track: "community",
    text: "Press reports that the largest unofficial PC effort and one of its chat servers went offline a day after the missing executable leaked, and that other servers in that scene are locking down. Reports differed at first on why. Rockstar did not respond to the outlet.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "Decrypt",
      href: "https://decrypt.co/383860/gta-6-pc-ports-nuked-just-days-before-devs-expected-it-to-be-playable",
    },
    short: "Decrypt",
  },
  {
    id: "press-2026-11-24-takedowns",
    date: "2026-11-24",
    track: "community",
    text: "Press reports that modders booted the leaked Xbox build of the game on PC within hours of a missing executable surfacing, and that Rockstar is reportedly acting against related online communities. One open-source project's code page became unreachable. Rockstar has not commented.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "Notebookcheck",
      href: "https://www.notebookcheck.net/As-GTA-6-PC-port-gets-closer-to-becoming-playable-Rockstar-is-reportedly-taking-action-against-modders-and-Discord-communities.1458181.0.html",
    },
    short: "Notebookcheck",
  },
  {
    id: "community-2026-11-24-linux",
    date: "2026-11-24",
    track: "community",
    text: "At least one unofficial project says it runs on Linux through Proton, and now says it reaches the game's story intro on a stock Proton build, though not playable and with a recorded run that crashed after about ten minutes. Others describe Wine-style translation layers. These are the projects' own claims, with no independent test and no playable run.",
    kind: "community",
    confidence: "unverified",
    linux: true,
    source: { name: "Community notes" },
    short: "Community notes",
  },
  {
    id: "press-2026-11-23-booting",
    date: "2026-11-23",
    track: "community",
    text: "Press reports that within hours of the missing executable appearing online, modders got the leaked Xbox build to start on a PC and get through its initial setup. It is still not playable, and the report relies on a modder's post.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "Notebookcheck",
      href: "https://www.notebookcheck.net/GTA-6-PC-port-progressing-at-breakneck-speed.1458028.0.html",
    },
    short: "Notebookcheck (Nov 23)",
  },
  {
    id: "press-2026-11-23-performance-estimate",
    date: "2026-11-23",
    track: "community",
    text: "Press reports that a hardware reviewer's console testing suggests matching the PS5's quality at 1440p and 60 fps would take at least a Ryzen 7 9700X-class processor with an RTX 5070-class graphics card, and that older mainstream PCs may land near 30 fps. These are estimates from console tests, not measurements on a PC, and there is no PC version to test.",
    kind: "press",
    confidence: "reported",
    linux: false,
    source: {
      name: "Notebookcheck",
      href: "https://www.notebookcheck.net/GTA-6-at-60-fps-on-PC-may-cost-less-than-expected-Geekerwan-estimates.1457142.0.html",
    },
    short: "Notebookcheck (estimates)",
  },
  {
    id: "rockstar-2026-11-19",
    date: "2026-11-19",
    track: "official",
    text: "GTA VI is out. Rockstar's game page lists PlayStation 5 and Xbox Series X|S, and no PC version.",
    kind: "official",
    confidence: "confirmed",
    linux: true,
    source: { name: "Rockstar Games", href: "https://www.rockstargames.com/VI" },
    short: "Rockstar Games",
  },
];

export interface StatusRow {
  id: "official" | "community" | "ready";
  label: string;
  /** Short badge text. */
  state: string;
  tone: "none" | "unverified" | "go";
  summary: string;
  /** Evidence ids behind this row. */
  evidence: string[];
}

export const STATUS_ROWS: readonly StatusRow[] = [
  {
    id: "official",
    label: "Official PC version",
    state: "None announced",
    tone: "none",
    summary: "Rockstar lists GTA VI for PS5 and Xbox Series X|S only. With no PC release there is no Steam version, so there is no Proton path to test yet.",
    evidence: ["rockstar-2026-11-19"],
  },
  {
    id: "community",
    label: "Unofficial community projects",
    state: "Experimental, unverified",
    tone: "unverified",
    summary: "Press reports that modders have booted a leaked console build on PC, got through its first setup and reached basic visuals at a very poor frame rate, that one effort now draws much of the open world at single-digit frame rates, and that the largest effort was hit by a Take-Two takedown notice. Some efforts are now reported to seem playable at only a few frames per second, but no playable build is confirmed, and press expects any early one to be rough. Linux runs are the projects' own claims.",
    evidence: ["press-2026-11-25-chapter-one-playable", "press-2026-11-25-new-leader-open-world", "press-2026-11-25-takedown-notice", "press-2026-11-24-in-game-rendering", "press-2026-11-24-low-fps-build", "press-2026-11-23-booting", "press-2026-11-24-effort-offline", "press-2026-11-24-takedowns", "community-2026-11-24-linux"],
  },
  {
    id: "ready",
    label: "What you can do now",
    state: "Prepare for an official release",
    tone: "go",
    summary: "If Rockstar ships a PC version, your setup will matter. Check your PC first, then use the Linux checklist: a Vulkan driver, enough memory, and a distro that suits gaming.",
    evidence: [],
  },
];

const DAY = 86_400_000;

/** Whole days between STATUS_REVIEWED and `today` (YYYY-MM-DD). */
export function statusAgeDays(today: string, reviewed: string = STATUS_REVIEWED): number {
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${reviewed}T00:00:00Z`)) / DAY);
}

export const statusIsStale = (today: string, reviewed: string = STATUS_REVIEWED): boolean => statusAgeDays(today, reviewed) > STATUS_STALE_DAYS;

/** Hosts we never link to from this page: code, chat, mirrors and social posts about the projects (Proton's own DXVK and VKD3D-Proton pages are the only github.com links, and they live in miami-targets.ts). */
export const NEVER_LINK_HOSTS = ["github.com", "gitlab.com", "codeberg.org", "discord.gg", "discord.com", "t.me", "reddit.com", "x.com", "twitter.com", "4chan.org", "mega.nz", "mediafire.com"] as const;

/** How many of the newest reports stay visible; the rest sit behind a "show older" toggle so the page stays short as the ledger grows. */
export const FEED_VISIBLE = 3;

/** Splits a newest-first list into the reports shown at once and the older ones behind the toggle. */
export function splitFeed<T>(items: readonly T[], visible: number = FEED_VISIBLE): { recent: T[]; older: T[] } {
  return { recent: items.slice(0, visible), older: items.slice(visible) };
}

export interface GamingLink {
  name: string;
  href: string;
  note: string;
  external?: true;
}

/** Where to go next for Linux players: internal pages, and the two outside lookups the page already allows. */
export const GAMING_LINKS: readonly GamingLink[] = [
  { name: "Best Linux for gaming", href: "/best/gaming/", note: "Distros that suit gaming" },
  { name: "Take the distro quiz", href: "/pick/", note: "Find one that fits you" },
  { name: ANTI_CHEAT_LINKS.tracker.name, href: ANTI_CHEAT_LINKS.tracker.href, note: "Anti-cheat status by game", external: true },
  { name: ANTI_CHEAT_LINKS.proton.name, href: ANTI_CHEAT_LINKS.proton.href, note: "Player reports by game", external: true },
];

/** The note shown under a verdict. It never changes the verdict: it only tells people what outlets are saying. */
export const REVIEWER_NOTE = {
  evidenceId: "press-2026-11-23-performance-estimate",
  text: "Press reports that one hardware reviewer's console testing suggests matching the PS5's quality at 1440p and 60 fps will take at least a Ryzen 7 9700X-class processor and an RTX 5070-class graphics card, and that older mainstream PCs may land near 30 fps. These are estimates from console tests, not measurements on a PC.",
} as const;
