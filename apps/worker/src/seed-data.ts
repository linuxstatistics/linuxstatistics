import type { Family } from "@linux-statistics/shared";

export interface SeedDistro {
  slug: string;
  name: string;
  family: Family;
  basedOnSlug?: string;
  homepage?: string;
  firstReleaseYear?: number;
  /** rank one year ago (for trend) */
  rankPrev: number;
  /** current rank */
  rank: number;
  /** current hits/day */
  hits: number;
  /** optional GitHub repo + current stars */
  repo?: { fullName: string; stars: number; forks: number; openIssues: number; commits30d: number; contributors: number };
}

/**
 * Curated top distros. Figures are plausible, representative seed data (not a
 * live capture) so the site renders meaningfully before real ingestion runs.
 */
export const TOP_DISTROS: SeedDistro[] = [
  { slug: "mint", name: "Linux Mint", family: "debian", basedOnSlug: "ubuntu", homepage: "https://linuxmint.com", firstReleaseYear: 2006, rankPrev: 3, rank: 1, hits: 2600, repo: { fullName: "linuxmint/cinnamon", stars: 5200, forks: 810, openIssues: 130, commits30d: 180, contributors: 92 } },
  { slug: "mx-linux", name: "MX Linux", family: "debian", basedOnSlug: "debian", homepage: "https://mxlinux.org", firstReleaseYear: 2014, rankPrev: 1, rank: 2, hits: 2510, repo: { fullName: "MX-Linux/mx-packageinstaller", stars: 640, forks: 70, openIssues: 25, commits30d: 40, contributors: 18 } },
  { slug: "endeavouros", name: "EndeavourOS", family: "arch", basedOnSlug: "arch", homepage: "https://endeavouros.com", firstReleaseYear: 2019, rankPrev: 4, rank: 3, hits: 1850, repo: { fullName: "endeavouros-team/EndeavourOS-Calamares", stars: 720, forks: 95, openIssues: 30, commits30d: 55, contributors: 40 } },
  { slug: "debian", name: "Debian", family: "debian", homepage: "https://debian.org", firstReleaseYear: 1993, rankPrev: 5, rank: 4, hits: 1600 },
  { slug: "fedora", name: "Fedora", family: "rpm", homepage: "https://fedoraproject.org", firstReleaseYear: 2003, rankPrev: 2, rank: 5, hits: 1540, repo: { fullName: "rpm-software-management/dnf", stars: 1300, forks: 350, openIssues: 210, commits30d: 60, contributors: 130 } },
  { slug: "manjaro", name: "Manjaro", family: "arch", basedOnSlug: "arch", homepage: "https://manjaro.org", firstReleaseYear: 2011, rankPrev: 6, rank: 6, hits: 1390, repo: { fullName: "manjaro/manjaro-tools", stars: 320, forks: 90, openIssues: 40, commits30d: 22, contributors: 35 } },
  { slug: "ubuntu", name: "Ubuntu", family: "debian", basedOnSlug: "debian", homepage: "https://ubuntu.com", firstReleaseYear: 2004, rankPrev: 7, rank: 7, hits: 1205 },
  { slug: "pop-os", name: "Pop!_OS", family: "debian", basedOnSlug: "ubuntu", homepage: "https://pop.system76.com", firstReleaseYear: 2017, rankPrev: 9, rank: 8, hits: 1090, repo: { fullName: "pop-os/shell", stars: 4300, forks: 230, openIssues: 180, commits30d: 35, contributors: 70 } },
  { slug: "opensuse", name: "openSUSE", family: "rpm", homepage: "https://opensuse.org", firstReleaseYear: 2005, rankPrev: 8, rank: 9, hits: 980, repo: { fullName: "openSUSE/openSUSE-release-tools", stars: 410, forks: 120, openIssues: 60, commits30d: 48, contributors: 55 } },
  { slug: "garuda", name: "Garuda Linux", family: "arch", basedOnSlug: "arch", homepage: "https://garudalinux.org", firstReleaseYear: 2020, rankPrev: 12, rank: 10, hits: 915, repo: { fullName: "garuda-linux/garuda-tools", stars: 290, forks: 45, openIssues: 18, commits30d: 30, contributors: 22 } },
  { slug: "zorin", name: "Zorin OS", family: "debian", basedOnSlug: "ubuntu", homepage: "https://zorin.com", firstReleaseYear: 2009, rankPrev: 10, rank: 11, hits: 870 },
  { slug: "arch", name: "Arch Linux", family: "arch", homepage: "https://archlinux.org", firstReleaseYear: 2002, rankPrev: 13, rank: 12, hits: 840, repo: { fullName: "archlinux/archinstall", stars: 4100, forks: 470, openIssues: 95, commits30d: 70, contributors: 160 } },
  { slug: "elementary", name: "elementary OS", family: "debian", basedOnSlug: "ubuntu", homepage: "https://elementary.io", firstReleaseYear: 2011, rankPrev: 11, rank: 13, hits: 760, repo: { fullName: "elementary/os", stars: 2700, forks: 320, openIssues: 90, commits30d: 25, contributors: 80 } },
  { slug: "kali", name: "Kali Linux", family: "debian", basedOnSlug: "debian", homepage: "https://kali.org", firstReleaseYear: 2013, rankPrev: 14, rank: 14, hits: 720 },
  { slug: "nobara", name: "Nobara", family: "rpm", basedOnSlug: "fedora", homepage: "https://nobaraproject.org", firstReleaseYear: 2022, rankPrev: 20, rank: 15, hits: 690 },
  { slug: "cachyos", name: "CachyOS", family: "arch", basedOnSlug: "arch", homepage: "https://cachyos.org", firstReleaseYear: 2021, rankPrev: 25, rank: 16, hits: 660, repo: { fullName: "CachyOS/CachyOS-Settings", stars: 380, forks: 40, openIssues: 12, commits30d: 33, contributors: 20 } },
];

// A long tail to populate the starfield / lower leaderboard.
const TAIL_NAMES: { name: string; family: Family; basedOnSlug?: string }[] = [
  { name: "Solus", family: "independent" },
  { name: "Slackware", family: "slackware" },
  { name: "Void Linux", family: "independent" },
  { name: "Gentoo", family: "gentoo" },
  { name: "NixOS", family: "independent" },
  { name: "Alpine Linux", family: "independent" },
  { name: "Rocky Linux", family: "rpm", basedOnSlug: "fedora" },
  { name: "AlmaLinux", family: "rpm", basedOnSlug: "fedora" },
  { name: "Lubuntu", family: "debian", basedOnSlug: "ubuntu" },
  { name: "Kubuntu", family: "debian", basedOnSlug: "ubuntu" },
  { name: "Xubuntu", family: "debian", basedOnSlug: "ubuntu" },
  { name: "Deepin", family: "debian", basedOnSlug: "debian" },
  { name: "Devuan", family: "debian", basedOnSlug: "debian" },
  { name: "Mageia", family: "rpm" },
  { name: "PCLinuxOS", family: "rpm" },
  { name: "antiX", family: "debian", basedOnSlug: "debian" },
  { name: "Bodhi Linux", family: "debian", basedOnSlug: "ubuntu" },
  { name: "Peppermint", family: "debian", basedOnSlug: "debian" },
  { name: "KDE neon", family: "debian", basedOnSlug: "ubuntu" },
  { name: "Artix Linux", family: "arch", basedOnSlug: "arch" },
  { name: "ArcoLinux", family: "arch", basedOnSlug: "arch" },
  { name: "Tumbleweed", family: "rpm" },
  { name: "Clear Linux", family: "independent" },
  { name: "Q4OS", family: "debian", basedOnSlug: "debian" },
  { name: "Parrot OS", family: "debian", basedOnSlug: "debian" },
  { name: "Tails", family: "debian", basedOnSlug: "debian" },
  { name: "Qubes OS", family: "independent" },
  { name: "Bluestar", family: "arch", basedOnSlug: "arch" },
  { name: "Feren OS", family: "debian", basedOnSlug: "debian" },
  { name: "SparkyLinux", family: "debian", basedOnSlug: "debian" },
];

export const TAIL_DISTROS: SeedDistro[] = TAIL_NAMES.map((t, i) => {
  const rank = 17 + i;
  const hits = Math.max(60, 640 - i * 18);
  return {
    slug: t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: t.name,
    family: t.family,
    basedOnSlug: t.basedOnSlug,
    rankPrev: rank + ((i % 5) - 2), // small wobble for trend variety
    rank,
    hits,
  };
});

export interface SeedSharePoint {
  year: number;
  linux: number;
  windows: number;
  macos: number;
}

// Yearly global desktop OS market share (plausible trend, %).
export const MARKET_SHARE: SeedSharePoint[] = [
  { year: 2010, linux: 0.9, windows: 91.0, macos: 7.3 },
  { year: 2012, linux: 1.1, windows: 89.4, macos: 8.5 },
  { year: 2014, linux: 1.4, windows: 88.0, macos: 9.4 },
  { year: 2016, linux: 1.7, windows: 84.6, macos: 11.2 },
  { year: 2018, linux: 1.9, windows: 82.3, macos: 13.0 },
  { year: 2020, linux: 2.4, windows: 77.7, macos: 17.0 },
  { year: 2022, linux: 2.9, windows: 75.5, macos: 15.3 },
  { year: 2024, linux: 3.7, windows: 72.1, macos: 15.4 },
  { year: 2025, linux: 4.0, windows: 71.3, macos: 15.2 },
  { year: 2026, linux: 4.13, windows: 70.9, macos: 15.1 },
];
