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
  else if (d.family !== "other") out.push({ id: `fam-${d.family}`, text: `you want a ${FAMILY_LABELS[d.family]}-family system` });
  if (d.rank != null && d.rank <= 20) out.push({ id: "popular", text: "you want a widely used distro with plenty of help online" });
  return out;
}

export interface PairVerdict {
  a: { name: string; reasons: string[] };
  b: { name: string; reasons: string[] };
}

/** "Pick A if… / Pick B if…": reasons that tell them apart (shared ones dropped), at most 3 each. */
export function pairVerdict(a: Facts, b: Facts, names: ReadonlyMap<string, string> = new Map()): PairVerdict | null {
  const ra = reasonsFor(a, a.basedOnSlug ? names.get(a.basedOnSlug) : null);
  const rb = reasonsFor(b, b.basedOnSlug ? names.get(b.basedOnSlug) : null);
  const shared = new Set(ra.map((r) => r.id).filter((id) => rb.some((r) => r.id === id)));
  const pa = ra.filter((r) => !shared.has(r.id)).slice(0, 3).map((r) => r.text);
  const pb = rb.filter((r) => !shared.has(r.id)).slice(0, 3).map((r) => r.text);
  if (pa.length === 0 && pb.length === 0) return null;
  return { a: { name: a.name, reasons: pa }, b: { name: b.name, reasons: pb } };
}

/** Join clauses as "a, b or c". */
export function orList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}
