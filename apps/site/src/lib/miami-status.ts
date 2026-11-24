/**
 * Where PC and Linux stand for GTA VI, kept by hand. Every ledger entry rests on a page we opened;
 * re-read them, and add dated rows, when STATUS_REVIEWED gets old.
 *
 * Link policy: we link to Rockstar and to press reporting, never to a project's code, chat server,
 * mirror, tracker or anything that explains how to get or run a leaked build. Claims that only appear
 * in project notes are listed as unverified text, without a link. Project names stay out of this file.
 */
/**
 * The only hosts an official or press entry may link to. Add an outlet here only after checking it is
 * reputable press; the tests fail for any other host, so a mislabeled entry cannot slip through.
 */
export const ALLOWED_SOURCE_HOSTS = ["rockstargames.com", "notebookcheck.net", "decrypt.co", "xda-developers.com"] as const;

export const STATUS_REVIEWED = "2026-11-24";

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
    text: "Press reports that the largest unofficial PC effort and one of its chat servers went offline a day after the missing executable leaked, and that other servers in that scene are locking down. Reports differ on why, and it is unclear whether any legal notice was sent. Rockstar did not respond to the outlet.",
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
    text: "Some of the unofficial projects claim runs under Proton on Linux, and at least one describes a Linux compatibility layer. These are the projects' own claims, with slow frame rates and missing graphics features, and nobody independent has confirmed them.",
    kind: "community",
    confidence: "unverified",
    linux: true,
    source: { name: "Community project notes, as summarized by a fan-run tracker (not linked)" },
    short: "Community notes (unverified)",
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
    summary: "Press reports modders have booted a leaked console build on PC, with basic visuals at a very poor frame rate, and that the largest effort has gone offline amid reported action against related communities. No playable build is confirmed. Linux runs are the projects' own claims.",
    evidence: ["press-2026-11-24-low-fps-build", "press-2026-11-24-effort-offline", "press-2026-11-24-takedowns", "community-2026-11-24-linux"],
  },
  {
    id: "ready",
    label: "What you can do now",
    state: "Prepare for an official release",
    tone: "go",
    summary: "If Rockstar ships a PC version, your setup will matter. Check your PC below, then use the Linux checklist: a Vulkan driver, enough memory, and a distro that suits gaming.",
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
