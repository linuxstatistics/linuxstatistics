import type { DistroDetail } from "@linux-statistics/shared";
import type { NextSteps } from "../components/PairVerdict";
import { GUIDE_SLUGS } from "./beginner-picker";
import { DISTRO_BLURBS } from "./distro-blurbs";
import { FAMILY_LABELS } from "./families";

/** First sentence of a description, kept short for a card. */
export function firstSentence(text: string, max = 220): string {
  const para = text.split(/\n\s*\n/).find(Boolean)?.trim() ?? "";
  const m = /^(.+?[.!?])(\s|$)/.exec(para);
  const s = m ? m[1]! : para;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Where to go from a compare verdict card, plus what we know for a distro without a profile. */
export function nextSteps(d: Pick<DistroDetail, "slug" | "name" | "family" | "basedOnSlug" | "firstReleaseYear" | "homepage" | "repoFullName" | "description">, nameOf?: (slug: string) => string | undefined): NextSteps {
  const text = DISTRO_BLURBS[d.slug]?.text ?? d.description?.text;
  const base = d.basedOnSlug ? (nameOf?.(d.basedOnSlug) ?? d.basedOnSlug) : null;
  const family = [
    d.family !== "other" ? (d.family === "independent" ? "Independent distro" : `${FAMILY_LABELS[d.family]} family`) : null,
    base ? `based on ${base}` : null,
    d.firstReleaseYear ? `first released ${d.firstReleaseYear}` : null,
  ].filter(Boolean).join(", ");
  return {
    href: `/distro/${d.slug}/`,
    guide: GUIDE_SLUGS.has(d.slug) ? `/switch/getting-started/?distro=${d.slug}` : undefined,
    summary: text ? firstSentence(text) : undefined,
    family: family ? family.charAt(0).toUpperCase() + family.slice(1) + "." : undefined,
    website: d.homepage ?? undefined,
    repo: d.repoFullName ?? undefined,
    slug: d.slug,
  };
}
