import type { DistroDetail } from "@linux-statistics/shared";
import type { NextSteps } from "../components/PairVerdict";
import { GUIDE_SLUGS } from "./beginner-picker";
import { DISTRO_BLURBS } from "./distro-blurbs";
import { referenceFor } from "./reference-profiles";

/** First sentence of a description, kept short for a card. */
export function firstSentence(text: string, max = 220): string {
  const para = text.split(/\n\s*\n/).find(Boolean)?.trim() ?? "";
  const m = /^(.+?[.!?])(\s|$)/.exec(para);
  const s = m ? m[1]! : para;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/**
 * Where to go from a compare verdict card, plus a one-line summary for a distro
 * without a profile. Facts already in the comparison table (family, base, first
 * release) are left out of the card.
 */
export function nextSteps(d: Pick<DistroDetail, "slug" | "homepage" | "repoFullName" | "description">): NextSteps {
  const text = referenceFor(d.slug)?.summary ?? DISTRO_BLURBS[d.slug]?.text ?? d.description?.text;
  return {
    href: `/distro/${d.slug}/`,
    guide: GUIDE_SLUGS.has(d.slug) ? `/switch/getting-started/?distro=${d.slug}` : undefined,
    summary: text ? firstSentence(text) : undefined,
    website: d.homepage ?? undefined,
    repo: d.repoFullName ?? undefined,
    slug: d.slug,
  };
}
