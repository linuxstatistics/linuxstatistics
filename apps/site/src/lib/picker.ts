import type { Desktop, Level, PickerProfile, Updates, Use } from "./picker-profiles";

export interface Answers {
  level: Level;
  use: Use;
  hardware: "new" | "old";
  updates: Updates | "any";
  desktop: Desktop | "any";
}

export interface Suggestion {
  key: string;
  score: number;
  reasons: string[];
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
  "old-hw": "older hardware",
  privacy: "privacy and security",
};
const DESKTOP_TEXT: Record<Desktop, string> = {
  "windows-like": "a Windows-style desktop",
  "mac-like": "a macOS-style desktop",
  gnome: "GNOME",
  kde: "KDE Plasma",
  light: "a lightweight desktop",
};

/**
 * Score every profile against the answers and return the best three, each with
 * the reasons it matched. `rankOf` (DistroWatch 12-month rank) breaks ties so
 * better-known distros come first. Pure: no I/O.
 */
export function suggest(
  answers: Answers,
  profiles: PickerProfile[],
  rankOf: (key: string) => number | null,
  count = 3,
): Suggestion[] {
  const scored = profiles.map((p) => {
    let score = 0;
    const reasons: string[] = [];
    if (p.levels.includes(answers.level)) {
      score += 3;
      reasons.push(`Suits ${LEVEL_TEXT[answers.level]}`);
    } else if (answers.level === "new") {
      score -= 4; // never push expert-only systems at beginners
    }
    if (p.uses.includes(answers.use)) {
      score += 4;
      reasons.push(`Good for ${USE_TEXT[answers.use]}`);
    }
    if (answers.hardware === "old") {
      if (p.uses.includes("old-hw") || p.desktops.includes("light")) {
        score += 2;
        if (answers.use !== "old-hw") reasons.push("Light enough for older hardware");
      } else score -= 2;
    }
    if (answers.updates !== "any" && p.updates === answers.updates) {
      score += 1;
      reasons.push(answers.updates === "stable" ? "Fixed releases with tested updates" : "Rolling updates with the newest software");
    }
    if (answers.desktop !== "any" && p.desktops.includes(answers.desktop)) {
      score += 2;
      reasons.push(`Offers ${DESKTOP_TEXT[answers.desktop]}`);
    }
    return { key: p.key, score, reasons };
  });
  return scored
    .sort((x, y) => y.score - x.score || (rankOf(x.key) ?? 9999) - (rankOf(y.key) ?? 9999))
    .slice(0, count);
}
