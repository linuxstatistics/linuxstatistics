import type { Desktop, Level, Pkg, Updates, Use } from "./picker-profiles";

/** Every answer is optional: a skipped or unasked question scores nothing. */
export interface Answers {
  /** Where the user is coming from. Nudges the desktop style when they have no preference. */
  from?: "windows" | "mac" | "linux" | "chromeos";
  use?: Use;
  level?: Level;
  device?: "pc" | "pi" | "arm" | "pc32";
  /** Roughly how much memory, in GB: 1 = under 2, 2 = 2–4, 4 = 4–8, 8 = 8 or more. */
  ram?: 1 | 2 | 4 | 8;
  gpu?: "nvidia" | "amd" | "intel" | "unsure";
  updates?: Updates;
  /** Wants updates that can be undone (image-based rollback or snapshots). */
  undo?: "yes" | "no";
  desktop?: Desktop;
  /** "none": nothing sent unless I agree. */
  telemetry?: "none" | "any";
  init?: "no-systemd" | "any";
  foss?: "yes" | "any";
  pkg?: Pkg;
}

export type QuestionId = keyof Answers;

export interface Question<K extends QuestionId = QuestionId> {
  id: K;
  legend: string;
  /** Shown behind "Why we ask". */
  why: string;
  /** Order is part of the share-link format: once launched, append new options, never reorder. */
  options: [NonNullable<Answers[K]>, string][];
  /** Whether to ask, given the answers so far. Missing = always. */
  show?: (a: Answers) => boolean;
}

const desktopLike = (a: Answers) => a.device === undefined || a.device === "pc";
const notServer = (a: Answers) => a.use !== "server";
const expert = (a: Answers) => a.level === "expert";

/** Asked in this order, skipping any whose `show` is false. Order is part of the share-link format: append only. */
export const QUESTIONS: Question[] = [
  {
    id: "from",
    legend: "Where are you coming from?",
    why: "We lean toward a desktop that will feel familiar.",
    options: [["windows", "Windows"], ["mac", "Mac"], ["linux", "I already use Linux"], ["chromeos", "ChromeOS"]],
  },
  {
    id: "use",
    legend: "What's it mainly for?",
    why: "Distros are tuned for different jobs: gaming distros ship drivers and Steam fixes, server distros skip the desktop, and running AI models needs a distro that NVIDIA CUDA or AMD ROCm supports.",
    options: [
      ["everyday", "Everyday use: web, email, office"],
      ["gaming", "Gaming"],
      ["old-hw", "Reviving an old computer"],
      ["dev", "Programming and development"],
      ["ai", "AI & Local LLMs"],
      ["server", "A server or home lab"],
      ["privacy", "Privacy and security"],
      ["creative", "Music, video or graphics work"],
    ],
  },
  {
    id: "level",
    legend: "How much Linux have you used?",
    why: "Some distros do everything for you; others expect you to set things up. We never suggest expert-only systems to beginners.",
    options: [["new", "None or very little"], ["some", "Some: I can use a terminal"], ["expert", "A lot: I like setting things up myself"]],
  },
  {
    id: "device",
    legend: "What will it run on?",
    why: "Not every distro makes images for Raspberry Pi, other ARM boards or old 32-bit PCs.",
    options: [["pc", "A laptop or desktop PC"], ["pi", "A Raspberry Pi"], ["arm", "Another ARM board"], ["pc32", "A very old PC (32-bit only)"]],
  },
  {
    id: "ram",
    legend: "How much memory (RAM) does it have?",
    why: "Heavier desktops feel slow below about 4 GB. On Windows: Settings → System → About. On a Mac: Apple menu → About This Mac.",
    options: [[1, "Under 2 GB"], [2, "2 to 4 GB"], [4, "4 to 8 GB"], [8, "8 GB or more"]],
  },
  {
    id: "gpu",
    legend: "What graphics card does it have?",
    why: "NVIDIA drivers are not open source, so some distros set them up for you and others leave it to you. For AI work it decides the toolkit: CUDA on NVIDIA, ROCm on AMD.",
    options: [["nvidia", "NVIDIA"], ["amd", "AMD"], ["intel", "Intel (built-in)"], ["unsure", "Not sure"]],
    show: (a) => a.use === "ai" || (desktopLike(a) && notServer(a) && a.use !== "old-hw" && a.ram !== 1),
  },
  {
    id: "updates",
    legend: "How do you like updates?",
    why: "Fixed releases change little between versions. Rolling releases get new software as soon as it's out, with more chance of surprises.",
    options: [["stable", "Stable: tested releases, fewer surprises"], ["rolling", "Rolling: always the newest software"]],
    show: (a) => a.level !== "new",
  },
  {
    id: "undo",
    legend: "Do you want updates you can undo?",
    why: "Image-based (atomic) systems and snapshot setups let you boot the previous version if an update breaks something.",
    options: [["yes", "Yes, that sounds safer"], ["no", "Doesn't matter to me"]],
    show: (a) => desktopLike(a) && notServer(a),
  },
  {
    id: "desktop",
    legend: "Which desktop would you like?",
    why: "The desktop is what you see and click. Most distros offer one main desktop; a few offer several.",
    options: [["windows-like", "Like Windows"], ["mac-like", "Like macOS"], ["gnome", "GNOME"], ["kde", "KDE Plasma"], ["light", "Light and simple"]],
    show: notServer,
  },
  {
    id: "telemetry",
    legend: "Should the system send any usage data?",
    why: "Some distros count installs or ask to send usage reports. We only claim \"sends nothing\" for distros we've checked.",
    options: [["none", "No: nothing unless I agree"], ["any", "Anonymous counting is fine"]],
    show: notServer,
  },
  {
    id: "init",
    legend: "Do you want to avoid systemd?",
    why: "systemd starts and manages services on most distros. A few use simpler alternatives such as OpenRC or runit.",
    options: [["no-systemd", "Yes, no systemd"], ["any", "Either is fine"]],
    show: expert,
  },
  {
    id: "foss",
    legend: "Free software only?",
    why: "Some distros ship only free software and leave out proprietary drivers, firmware and codecs.",
    options: [["yes", "Yes, only free software"], ["any", "Proprietary drivers and codecs are fine"]],
    show: expert,
  },
  {
    id: "pkg",
    legend: "Preferred package format?",
    why: "If you know apt, dnf or pacman already, staying with it saves relearning.",
    options: [["deb", "deb (apt)"], ["rpm", "rpm (dnf, zypper)"], ["pacman", "pacman (Arch)"]],
    show: expert,
  },
];

/** The questions that apply now, given the answers so far. */
export function flow(a: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.show || q.show(a));
}

/** Drop answers to questions that no longer apply (e.g. after changing the level). */
export function prune(a: Answers): Answers {
  const ids = new Set(flow(a).map((q) => q.id));
  return Object.fromEntries(Object.entries(a).filter(([k]) => ids.has(k as QuestionId))) as Answers;
}

/**
 * Share code: one character per question in QUESTIONS order, "0" = skipped,
 * "1".."9" = option index + 1. Trailing zeros are dropped. Ignores bad input.
 */
export function encodeAnswers(a: Answers): string {
  const s = QUESTIONS.map((q) => {
    const i = q.options.findIndex(([v]) => v === a[q.id]);
    return i < 0 ? "0" : String(i + 1);
  }).join("");
  return s.replace(/0+$/, "");
}

export function decodeAnswers(code: string | null | undefined): Answers {
  const out: Record<string, unknown> = {};
  if (!code || !/^[0-9]{1,32}$/.test(code)) return {};
  QUESTIONS.forEach((q, i) => {
    const n = Number(code[i] ?? "0");
    const opt = n > 0 ? q.options[n - 1] : undefined;
    if (opt) out[q.id] = opt[0];
  });
  return prune(out as Answers);
}
