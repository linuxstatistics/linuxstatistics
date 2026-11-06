/**
 * Seed data. Rankings come from a local, git-ignored capture of the ranking
 * page at `<root>/.data/ranking-capture.html` when present, else from the
 * synthetic test page (invented ranks). GitHub figures and the market-share series are
 * representative samples until those sources are ingested live.
 */

export const SEED_CAPTURE = ".data/ranking-capture.html";
export const SEED_FALLBACK = "apps/worker/test/fixtures/ranking-full.html";
export const SEED_CAPTURED_AT = new Date("2026-11-03T00:30:00.000Z");

/** Old seed slugs, kept resolvable after the switch to DistroWatch keys. */
export const LEGACY_SLUGS: Record<string, string> = {
  "mx-linux": "mx",
  endeavouros: "endeavour",
  "pop-os": "popos",
  "garuda-linux": "garuda",
  "linux-mint": "mint",
  "arch-linux": "arch",
  "zorin-os": "zorin",
  "kali-linux": "kali",
  "void-linux": "void",
  "alpine-linux": "alpine",
  "rocky-linux": "rocky",
  almalinux: "alma",
  "parrot-os": "parrot",
  "qubes-os": "qubes",
  "artix-linux": "artix",
  "kde-neon": "kdeneon",
};

export interface SeedRepo {
  key: string;
  fullName: string;
  stars: number;
  forks: number;
  openIssues: number;
  commits30d: number;
  contributors: number;
}

export const SEED_REPOS: SeedRepo[] = [
  { key: "mint", fullName: "linuxmint/cinnamon", stars: 5200, forks: 810, openIssues: 130, commits30d: 180, contributors: 92 },
  { key: "mx", fullName: "MX-Linux/mx-packageinstaller", stars: 640, forks: 70, openIssues: 25, commits30d: 40, contributors: 18 },
  { key: "endeavour", fullName: "endeavouros-team/EndeavourOS-Calamares", stars: 720, forks: 95, openIssues: 30, commits30d: 55, contributors: 40 },
  { key: "fedora", fullName: "rpm-software-management/dnf", stars: 1300, forks: 350, openIssues: 210, commits30d: 60, contributors: 130 },
  { key: "manjaro", fullName: "manjaro/manjaro-tools", stars: 320, forks: 90, openIssues: 40, commits30d: 22, contributors: 35 },
  { key: "popos", fullName: "pop-os/shell", stars: 4300, forks: 230, openIssues: 180, commits30d: 35, contributors: 70 },
  { key: "opensuse", fullName: "openSUSE/openSUSE-release-tools", stars: 410, forks: 120, openIssues: 60, commits30d: 48, contributors: 55 },
  { key: "garuda", fullName: "garuda-linux/garuda-tools", stars: 290, forks: 45, openIssues: 18, commits30d: 30, contributors: 22 },
  { key: "arch", fullName: "archlinux/archinstall", stars: 4100, forks: 470, openIssues: 95, commits30d: 70, contributors: 160 },
  { key: "elementary", fullName: "elementary/os", stars: 2700, forks: 320, openIssues: 90, commits30d: 25, contributors: 80 },
  { key: "cachyos", fullName: "CachyOS/CachyOS-Settings", stars: 380, forks: 40, openIssues: 12, commits30d: 33, contributors: 20 },
];

export interface SeedSharePoint {
  year: number;
  linux: number;
  windows: number;
  macos: number;
}

// Yearly global desktop OS market share (representative trend, %). The 2026
// figure matches StatCounter's September 2026 worldwide desktop Linux share.
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
  { year: 2026, linux: 4.54, windows: 76.36, macos: 16.78 },
];
