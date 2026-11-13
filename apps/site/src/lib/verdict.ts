import type { DistroListItem } from "@linux-statistics/shared";
import { PROFILES, type PickerProfile } from "./picker-profiles";
import { FAMILY_LABELS } from "./families";

const PROFILE = new Map(PROFILES.map((p) => [p.key, p]));
export const profileFor = (key: string): PickerProfile | null => PROFILE.get(key) ?? null;

type Facts = Pick<DistroListItem, "slug" | "name" | "family" | "rank"> & { basedOnSlug?: string | null };

/** Reasons to pick a distro, as "Pick X if…" clauses. Each has a stable id so pairs can drop shared ones. */
export function reasonsFor(d: Facts, baseName?: string | null): { id: string; text: string }[] {
  const p = profileFor(d.slug);
  const out: { id: string; text: string }[] = [];
  if (p) {
    if (p.levels.includes("new")) out.push({ id: "new", text: "you're new to Linux" });
    else if (p.levels.length === 1 && p.levels[0] === "expert") out.push({ id: "expert", text: "you want full control and don't mind the terminal" });
    if (p.uses.includes("gaming")) out.push({ id: "gaming", text: "you play games on PC" });
    if (p.uses.includes("old-hw")) out.push({ id: "old-hw", text: "your computer is older or low on memory" });
    if (p.uses.includes("dev")) out.push({ id: "dev", text: "you write software" });
    if (p.uses.includes("ai")) out.push({ id: "ai", text: "you run AI models or LLMs on your own GPU" });
    if (p.uses.includes("privacy")) out.push({ id: "privacy", text: "privacy or security is the priority" });
    out.push(
      p.updates === "rolling"
        ? { id: "rolling", text: "you want the newest software as soon as it's out" }
        : { id: "stable", text: "you prefer tested updates on a fixed schedule" },
    );
    if (p.desktops.includes("windows-like")) out.push({ id: "windows-like", text: "you want a desktop that feels like Windows" });
    else if (p.desktops.includes("mac-like")) out.push({ id: "mac-like", text: "you like a macOS-style desktop" });
    return out;
  }
  // No curated profile: fall back to facts we know.
  if (baseName) out.push({ id: `base-${d.basedOnSlug}`, text: `you like ${baseName} but want a different take on it` });
  else if (d.family === "independent") out.push({ id: "fam-independent", text: "you want a system built from scratch, not based on another distro" });
  else if (d.family !== "other") out.push({ id: `fam-${d.family}`, text: `you want a ${FAMILY_LABELS[d.family]}-family system` });
  if (d.rank != null && d.rank <= 20) out.push({ id: "popular", text: "you want a widely used distro with plenty of help online" });
  return out;
}

export interface PairVerdict {
  a: VerdictSide;
  b: VerdictSide;
}

export interface VerdictSide {
  name: string;
  reasons: string[];
  /**
   * Why a side has no reasons: "same" = both suit the same people (profile
   * exists, nothing sets it apart); "unknown" = we don't know enough.
   */
  empty?: "same" | "unknown";
  /** One-line profile summary shown when nothing sets it apart. */
  blurb?: string;
}

/** Desktop-style tie-breakers, used when the main reasons are all shared. */
const DESKTOP_TEXT: Record<string, string> = {
  gnome: "you like the GNOME desktop",
  kde: "you like KDE Plasma and lots of settings",
  light: "you want a light, simple desktop",
};

/** "Pick A if… / Pick B if…": reasons that tell them apart (shared ones dropped), at most 3 each. */
export function pairVerdict(a: Facts, b: Facts, names: ReadonlyMap<string, string> = new Map()): PairVerdict | null {
  const ra = reasonsFor(a, a.basedOnSlug ? names.get(a.basedOnSlug) : null);
  const rb = reasonsFor(b, b.basedOnSlug ? names.get(b.basedOnSlug) : null);
  const shared = new Set(ra.map((r) => r.id).filter((id) => rb.some((r) => r.id === id)));
  const side = (d: Facts, own: { id: string; text: string }[], other: Facts): VerdictSide => {
    let reasons = own.filter((r) => !shared.has(r.id)).slice(0, 3).map((r) => r.text);
    const p = profileFor(d.slug);
    if (reasons.length === 0 && p) {
      // Fall back to desktops the other one doesn't offer.
      const op = profileFor(other.slug);
      reasons = p.desktops
        .filter((x) => !op?.desktops.includes(x) && DESKTOP_TEXT[x])
        .slice(0, 2)
        .map((x) => DESKTOP_TEXT[x]!);
    }
    if (reasons.length > 0) return { name: d.name, reasons };
    return p ? { name: d.name, reasons: [], empty: "same", blurb: p.blurb } : { name: d.name, reasons: [], empty: "unknown" };
  };
  const va = side(a, ra, b);
  const vb = side(b, rb, a);
  if (va.reasons.length === 0 && vb.reasons.length === 0 && va.empty === "unknown" && vb.empty === "unknown") return null;
  return { a: va, b: vb };
}

/** Join clauses as "a, b or c". */
export function orList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}
