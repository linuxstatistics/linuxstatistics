import type { DistroListItem } from "@linux-statistics/shared";
import { profileFor } from "./verdict";
import { telemetryFor, TELEMETRY_LABEL } from "./telemetry";

type Facts = Pick<DistroListItem, "slug" | "name" | "rank" | "hitsPerDay" | "firstReleaseYear"> & {
  basedOnSlug?: string | null;
};

export interface QA {
  q: string;
  a: string;
}

/**
 * Questions people ask about a pair, answered only when our data supports an
 * answer. Order: popularity, beginners, gaming, updates, older PCs, relation.
 */
export function pairFaq(a: Facts, b: Facts): QA[] {
  const out: QA[] = [];
  const pa = profileFor(a.slug);
  const pb = profileFor(b.slug);

  if (a.rank != null && b.rank != null && a.rank !== b.rank) {
    const [hi, lo] = a.rank < b.rank ? [a, b] : [b, a];
    out.push({
      q: `Is ${a.name} or ${b.name} more popular?`,
      a: `${hi.name} draws more interest over the last 12 months (#${hi.rank} vs #${lo.rank} in our popularity ranking). That measures interest, not installs.`,
    });
  }

  if (pa && pb) {
    const na = pa.levels.includes("new");
    const nb = pb.levels.includes("new");
    if (na !== nb) {
      const [yes, no] = na ? [a, b] : [b, a];
      out.push({
        q: `Which is better for beginners, ${a.name} or ${b.name}?`,
        a: `${yes.name} is the easier start: it's aimed at people new to Linux. ${no.name} expects some Linux experience.`,
      });
    } else if (na && nb) {
      out.push({ q: `Which is better for beginners, ${a.name} or ${b.name}?`, a: `Both suit people new to Linux. The choice mostly comes down to the desktop you prefer.` });
    }

    const ga = pa.uses.includes("gaming");
    const gb = pb.uses.includes("gaming");
    if (ga !== gb) {
      const [yes, no] = ga ? [a, b] : [b, a];
      out.push({
        q: `Is ${a.name} or ${b.name} better for gaming?`,
        a: `${yes.name} is set up with gaming in mind. ${no.name} can run Steam and Proton too, but needs more setup.`,
      });
    }

    if (pa.updates !== pb.updates) {
      const [roll, stab] = pa.updates === "rolling" ? [a, b] : [b, a];
      out.push({
        q: `How do updates differ between ${a.name} and ${b.name}?`,
        a: `${roll.name} is a rolling release: software updates continuously, so you always have the newest versions. ${stab.name} ships tested releases on a schedule, so updates are fewer and calmer.`,
      });
    }

    const oa = pa.uses.includes("old-hw");
    const ob = pb.uses.includes("old-hw");
    if (oa !== ob) {
      const yes = oa ? a : b;
      out.push({ q: `Which runs better on an older computer?`, a: `${yes.name} is the lighter choice and is known for running well on older hardware.` });
    }
  }

  const ta = telemetryFor(a.slug);
  const tb = telemetryFor(b.slug);
  if (ta && tb) {
    const line = (name: string, t: NonNullable<typeof ta>) =>
      t.level === "counting" ? `${name} sends an anonymous count by default (you can turn it off).` : `${name}: ${TELEMETRY_LABEL[t.level].toLowerCase()}.`;
    out.push({
      q: `Does ${a.name} or ${b.name} collect telemetry?`,
      a: `${line(a.name, ta)} ${line(b.name, tb)} Apps you install have their own settings.`,
    });
  }

  if (a.basedOnSlug === b.slug || b.basedOnSlug === a.slug) {
    const [child, parent] = a.basedOnSlug === b.slug ? [a, b] : [b, a];
    out.push({
      q: `Is ${child.name} based on ${parent.name}?`,
      a: `Yes. ${child.name} is built on ${parent.name}, so most ${parent.name} software and guides also work on it.`,
    });
  }
  return out;
}

/** schema.org FAQPage for the questions. */
export function faqJsonLd(items: QA[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };
}
