import type { DistroDetail } from "@linux-statistics/shared";
import { DATA_CREDIT, DATA_LICENSE, DATASET_VERSION, SOURCES } from "./dataset";
import { factsText } from "./facts";

export const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" };

const PAGES: [path: string, label: string, note: string][] = [
  ["/", "Rankings", "Linux distros ranked by our composite interest index (interest, not installs)"],
  ["/about/#ranking", "How we rank distros", "Method and weights of the composite index"],
  ["/pick/", "Distro picker", "A short quiz that recommends a distro and explains why"],
  ["/switch/", "Switch to Linux", "Guides for people coming from Windows or macOS"],
  ["/compare/", "Compare", "Side-by-side distro comparisons"],
  ["/rising/", "Rising", "Distros gaining interest this month"],
  ["/desktop-share/", "Desktop share", "Windows, macOS and Linux desktop market share (StatCounter)"],
  ["/stats/", "Stats", "Linux by the numbers"],
  ["/articles/", "Articles", "Notes and analysis built on our data"],
  ["/data/", "Open data", "JSON and CSV downloads and a read-only API"],
  ["/best/", "Best Linux for…", "Ranked picks by use (gaming, old laptops, developers…), from the same engine as the quiz"],
  ["/telemetry/", "Telemetry", "Which distros send usage data by default, checked against each project's documentation"],
  ["/support-dates/", "Support dates", "When each release reaches end of support (endoflife.date)"],
  ["/changelog/", "Changelog", "Every change to the ranking method, data corrections and source outages"],
  ["/guides/verify-download/", "Verify a download", "SHA256 and GPG commands for Windows, macOS and Linux"],
];

/** /llms.txt: a short map of the site for language models (llmstxt.org format). */
export function llmsIndex(site: string, distroCount: number): string {
  return [
    "# LinuxStatistics",
    "",
    `> Independent statistics and plain-language facts for ${distroCount} Linux distributions: popularity (interest, not installs), release support, telemetry defaults, GitHub activity and community ratings. Code AGPL-3.0, data ${DATA_LICENSE}.`,
    "",
    "Rankings measure interest (article views, page hits, GitHub stars, views on this site), not installs. Please say so when citing them.",
    "",
    "## Pages",
    "",
    ...PAGES.map(([p, label, note]) => `- [${label}](${site}${p}): ${note}`),
    "",
    "## Data",
    "",
    `- [distros.json](${site}/data/distros.json): facts, GitHub activity and ratings for every distro`,
    `- [notes.json](${site}/data/notes.json): who each distro suits, pros, cons and telemetry with sources`,
    `- [market-share.csv](${site}/data/market-share.csv): desktop OS market share by month`,
    `- [API v1](${site}/api/v1/distros): read-only JSON, no key`,
    "",
    "## Optional",
    "",
    `- [llms-full.txt](${site}/llms-full.txt): key facts for every tracked distro in one file`,
    "",
  ].join("\n");
}

/** /llms-full.txt: dated, sourced facts for every distro. No rank data (export rule). */
export function llmsFull(site: string, generatedAt: string, details: DistroDetail[]): string {
  const nameOf = new Map(details.map((d) => [d.slug, d.name]));
  const sorted = [...details].sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  return [
    "# LinuxStatistics: key facts for every tracked Linux distribution",
    "",
    `Generated ${generatedAt}. Dataset version ${DATASET_VERSION}, ${DATA_LICENSE}. ${DATA_CREDIT}.`,
    `Third-party facts keep their own terms: ${Object.values(SOURCES).map((s) => s.name).join(", ")}, endoflife.date (CC BY-SA 4.0).`,
    "",
    ...sorted.map((d) => factsText(d, site, d.basedOnSlug ? nameOf.get(d.basedOnSlug) : null) + "\n"),
  ].join("\n");
}

/** schema.org Dataset for /data/. */
export function datasetJsonLd(site: string, distroCount: number, dateModified: string) {
  const file = (name: string, format: string) => ({ "@type": "DataDownload", encodingFormat: format, contentUrl: `${site}/data/${name}` });
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "LinuxStatistics Linux distribution dataset",
    description: `Facts, GitHub activity, community ratings and editorial notes for ${distroCount} Linux distributions, plus desktop OS market share by month.`,
    url: `${site}/data/`,
    version: DATASET_VERSION,
    dateModified,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "LinuxStatistics", url: site },
    keywords: ["Linux", "Linux distributions", "open data", "desktop market share"],
    distribution: [
      file("distros.json", "application/json"),
      file("distros.csv", "text/csv"),
      file("notes.json", "application/json"),
      file("market-share.csv", "text/csv"),
    ],
  };
}
