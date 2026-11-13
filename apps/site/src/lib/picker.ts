import type { Desktop, Level, PickerProfile, Use } from "./picker-profiles";
import type { Answers } from "./picker-questions";
import { sendsNothingByDefault, telemetryFor } from "./telemetry";

export type { Answers } from "./picker-questions";

/** The desktop that feels familiar for each origin. */
const FAMILIAR: Partial<Record<NonNullable<Answers["from"]>, { desktop: Desktop; reason: string }>> = {
  windows: { desktop: "windows-like", reason: "Feels familiar coming from Windows" },
  mac: { desktop: "mac-like", reason: "Feels familiar coming from a Mac" },
  chromeos: { desktop: "gnome", reason: "Simple, launcher-style desktop like ChromeOS" },
};

export interface Suggestion {
  key: string;
  score: number;
  /** Best score any distro could get for these answers. */
  max: number;
  /** 0–100: score / max, for display. */
  pct: number;
  reasons: string[];
  /** Answers it doesn't match ("watch out for"). */
  misses: string[];
}

const LEVEL_TEXT: Record<Level, string> = {
  new: "new to Linux",
  some: "some Linux experience",
  expert: "experienced users",
};
const USE_TEXT: Record<Use, string> = {
  everyday: "everyday use",
  gaming: "gaming",
  dev: "development",
  creative: "music, video and graphics work",
  "old-hw": "older hardware",
  privacy: "privacy and security",
  server: "servers and home labs",
  ai: "running AI models locally",
};
const DESKTOP_TEXT: Record<Desktop, string> = {
  "windows-like": "a Windows-style desktop",
  "mac-like": "a macOS-style desktop",
  gnome: "GNOME",
  kde: "KDE Plasma",
  light: "a lightweight desktop",
};
const PKG_TEXT = { deb: "deb packages (apt)", rpm: "rpm packages", pacman: "pacman (Arch packages)", other: "its own package format" } as const;

/** Distros that can't work for these answers at all: wrong hardware, too little memory, expert-only for a beginner. */
export function fits(p: PickerProfile, a: Answers): boolean {
  if (a.device && !p.platforms.includes(a.device)) return false;
  if (typeof a.ram === "number" && p.minRamGb > a.ram) return false;
  if (a.level === "new" && !p.levels.includes("new") && !p.levels.includes("some")) return false;
  return true;
}

/** Score one profile. Every criterion adds its best possible points to `max`, so pct compares like with like. */
export function score(p: PickerProfile, a: Answers): Omit<Suggestion, "pct"> {
  let score = 0;
  let max = 0;
  const reasons: string[] = [];
  const misses: string[] = [];
  const crit = (best: number, got: number, reason?: string, miss?: string) => {
    max += best;
    score += got;
    if (got > 0 && reason) reasons.push(reason);
    if (got <= 0 && miss) misses.push(miss);
  };

  if (a.level) {
    if (p.levels.includes(a.level)) crit(3, 3, `Suits ${LEVEL_TEXT[a.level]}`);
    else crit(3, a.level === "new" ? -4 : -1, undefined, a.level === "new" ? "Expects some Linux experience" : a.level === "expert" ? "Made for beginners; less to tinker with" : "Aimed at a different experience level");
  }
  if (a.use) {
    const ok = p.uses.includes(a.use);
    crit(4, ok ? 4 : a.use === "server" || a.use === "gaming" || a.use === "creative" || a.use === "ai" ? -2 : 0, `Good for ${USE_TEXT[a.use]}`, `Not built mainly for ${USE_TEXT[a.use]}`);
  }
  if (a.device === "pi" || a.device === "arm") {
    crit(2, p.madeFor === a.device ? 2 : 0, a.device === "pi" ? "Made for Raspberry Pi" : "Made for ARM boards");
  }
  const lowMem = typeof a.ram === "number" && a.ram <= 2;
  if (lowMem || a.use === "old-hw") {
    const light = p.uses.includes("old-hw") || p.desktops.includes("light") || p.minRamGb <= 1;
    crit(2, light ? 2 : -2, a.use === "old-hw" ? undefined : "Light enough for older hardware", "Heavier than the light options");
  }
  if (a.gpu === "nvidia") {
    const pts = { excellent: 3, good: 1, fair: 0, poor: -3 }[p.nvidia];
    crit(3, pts, p.nvidia === "excellent" ? "NVIDIA drivers set up for you" : "NVIDIA drivers easy to add", p.nvidia === "poor" ? "NVIDIA cards poorly supported" : "NVIDIA drivers need manual setup");
  }
  if (a.use === "ai" && a.gpu === "nvidia") {
    crit(3, p.cuda ? 3 : -2, "CUDA available from NVIDIA or the distro's own packages", "No official CUDA packages");
  } else if (a.use === "ai" && a.gpu === "amd") {
    crit(3, p.rocm ? 3 : -2, "AMD ROCm supported or packaged", "ROCm not officially supported");
  }
  if (a.updates) {
    // "Not sure" gets the safer default.
    const want = a.updates === "any" ? "stable" : a.updates;
    crit(2, p.updates === want ? 2 : 0, want === "stable" ? "Fixed releases with tested updates" : "Rolling updates with the newest software", p.updates === "rolling" ? "Rolling updates, not fixed releases" : "Fixed releases, not rolling");
  }
  if (a.undo === "yes") {
    crit(3, p.undo === "rollback" ? 3 : p.undo === "snapshots" ? 2 : 0, p.undo === "rollback" ? "Updates you can roll back" : "Snapshots let you undo updates", "No built-in way to undo updates");
  }
  if (a.desktop && a.desktop !== "any") {
    crit(2, p.desktops.includes(a.desktop) ? 2 : 0, `Offers ${DESKTOP_TEXT[a.desktop]}`, `Doesn't offer ${DESKTOP_TEXT[a.desktop]} by default`);
  } else {
    const fam = a.from ? FAMILIAR[a.from] : undefined;
    if (fam) crit(2, p.desktops.includes(fam.desktop) ? 2 : 0, fam.reason);
  }
  if (a.init === "no-systemd") crit(4, p.init === "other" ? 4 : -4, "Doesn't use systemd", "Uses systemd");
  if (a.foss === "yes") crit(4, p.fossOnly ? 4 : -1, "Free software only", "Includes non-free drivers or firmware");
  if (a.pkg && a.pkg !== "any") crit(2, p.pkg === a.pkg ? 2 : 0, `Uses ${PKG_TEXT[a.pkg]}`, `Uses ${PKG_TEXT[p.pkg]}`);

  // Telemetry: only distros we've checked count as "sends nothing by default".
  // The fact is always shown; the answer only changes the score.
  const t = telemetryFor(p.key);
  const strict = a.telemetry === "none";
  if (t && sendsNothingByDefault(t)) reasons.push(t.level === "none" ? "Sends no usage data" : "Sends no usage data unless you agree");
  if (strict || a.use === "privacy") {
    const best = strict ? 3 : 1;
    // Not checked: no points and no penalty; the card says "not checked yet".
    const got = sendsNothingByDefault(t) ? best : t?.level === "usage" ? (strict ? -8 : -4) : t?.level === "counting" ? (strict ? -6 : -2) : 0;
    crit(best, got, undefined, t?.level === "usage" ? "Sends usage data by default" : t?.level === "counting" ? "Counts installs by default (can be turned off)" : strict ? "Usage data not checked yet" : undefined);
  }
  return { key: p.key, score, max, reasons, misses };
}

/**
 * Every distro that fits, best first, each with reasons, misses and a match %.
 * `rankOf` (12-month popularity rank) breaks ties so better-known distros come first. Pure: no I/O.
 */
export function rankAll(answers: Answers, profiles: PickerProfile[], rankOf: (key: string) => number | null): Suggestion[] {
  return profiles
    .filter((p) => fits(p, answers))
    .map((p) => {
      const s = score(p, answers);
      return { ...s, pct: s.max > 0 ? Math.max(0, Math.min(100, Math.round((s.score / s.max) * 100))) : 0 };
    })
    .sort((x, y) => y.score - x.score || (rankOf(x.key) ?? 9999) - (rankOf(y.key) ?? 9999));
}

/** The best `count` suggestions. */
export function suggest(answers: Answers, profiles: PickerProfile[], rankOf: (key: string) => number | null, count = 3): Suggestion[] {
  return rankAll(answers, profiles, rankOf).slice(0, count);
}
