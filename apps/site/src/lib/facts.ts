import type { DistroDetail } from "@linux-statistics/shared";
import { FAMILY_LABELS } from "./families";
import { releaseStats } from "../components/DistroStats";
import { telemetryFor } from "./telemetry";

export interface KeyFact {
  text: string;
  /** Where the fact comes from, shown as a short credit. */
  source: string;
}

const month = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export interface FactOptions {
  baseName?: string | null;
  /** YYYY-MM-DD of the index data; needed for the rank fact. */
  asOf?: string | null;
  /** Rank sentences are for pages only; exports (llms-full.txt) leave them out. */
  includeRank?: boolean;
  today?: string;
}

/**
 * Short, quotable sentences about one distro, each dated or sourced. Unknown facts
 * are left out. Ranks cite our own index, never a third-party ranking site.
 */
export function keyFacts(d: DistroDetail, opts: FactOptions = {}): KeyFact[] {
  const out: KeyFact[] = [];
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  if (opts.includeRank && d.rank != null && opts.asOf) {
    out.push({ text: `${d.name} ranked #${d.rank} on the LinuxStatistics composite index over the 12 months to ${month(opts.asOf)}.`, source: "LinuxStatistics index" });
  }
  if (d.status === "discontinued") out.push({ text: `${d.name} is discontinued.`, source: "Wikidata" });
  if (d.basedOnSlug && opts.baseName) {
    out.push({ text: `${d.name} is based on ${opts.baseName}.`, source: "LinuxStatistics" });
  } else if (d.family === "independent") {
    out.push({ text: `${d.name} is an independent distribution, not based on another distro.`, source: "LinuxStatistics" });
  } else if (d.family !== "other" && d.slug === d.family) {
    out.push({ text: `${d.name} is the base of the ${FAMILY_LABELS[d.family]} family of distributions.`, source: "LinuxStatistics" });
  } else if (d.family !== "other") {
    out.push({ text: `${d.name} belongs to the ${FAMILY_LABELS[d.family]} family.`, source: "LinuxStatistics" });
  }
  if (d.firstReleaseYear != null) out.push({ text: `${d.name} was first released in ${d.firstReleaseYear}.`, source: "Wikidata" });
  const rel = releaseStats(d, today);
  const latest = rel.find((r) => r[0] === "Latest release");
  const support = rel.find((r) => r[0] !== "Latest release");
  if (latest) out.push({ text: `The latest ${d.name} release is ${latest[1]}${latest[2] ? ` (${latest[2]})` : ""}.`, source: "endoflife.date" });
  if (support) {
    out.push({
      text: support[0] === "Support ended" ? `Support for that release ended in ${support[1]}.` : `That release is supported until ${support[1]}.`,
      source: "endoflife.date",
    });
  }
  const t = telemetryFor(d.slug);
  if (t) out.push({ text: t.detail, source: "LinuxStatistics check of the project's docs" });
  if (d.repoFullName && d.stars != null) {
    out.push({ text: `${d.name}'s main GitHub repository (${d.repoFullName}) has ${d.stars.toLocaleString("en-US")} stars.`, source: `GitHub, ${month(today)}` });
  }
  if (d.userRating.count > 0 && d.userRating.average != null) {
    out.push({
      text: `LinuxStatistics users rate ${d.name} ${d.userRating.average.toFixed(1)} out of 5 from ${d.userRating.count} rating${d.userRating.count === 1 ? "" : "s"}.`,
      source: "LinuxStatistics users",
    });
  }
  return out;
}

/** One plain-text block for /llms-full.txt (no rank data). */
export function factsText(d: DistroDetail, site: string, baseName?: string | null): string {
  const lines = keyFacts(d, { baseName, includeRank: false }).map((f) => `- ${f.text} (Source: ${f.source})`);
  return [`## ${d.name}`, "", `Page: ${site}/distro/${d.slug}/`, ...(d.homepage ? [`Website: ${d.homepage}`] : []), "", ...lines].join("\n");
}
