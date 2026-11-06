/**
 * What the operating system itself sends home by default, keyed by
 * distro slug. Only distros checked against the project's own docs are
 * listed; anything missing is "not checked" and the site makes no claim.
 * Apps you install (browsers, Steam…) have their own policies and aren't
 * covered. Checked 2026-11-05, pending maintainer review.
 */
export type TelemetryLevel =
  /** The OS sends no usage data. */
  | "none"
  /** Off unless you agree (asked at install or in settings). */
  | "opt-in"
  /** On by default: an anonymous install count or similar; can be turned off. */
  | "counting";

export interface TelemetryInfo {
  key: string;
  level: TelemetryLevel;
  /** One plain sentence: what is sent, or that nothing is. */
  detail: string;
  /** How to turn it off, when it's on by default. */
  turnOff?: string;
  source: string;
  /**
   * "build": confirmed in the project's build files or source code.
   * "statement": the project's own published statement only.
   */
  checked: "build" | "statement";
  /** The file or page that was checked, for maintainers. */
  evidence: string;
}

export const TELEMETRY: TelemetryInfo[] = [
  {
    key: "mint",
    level: "none",
    detail: "Linux Mint says the OS collects no telemetry.",
    source: "https://github.com/orgs/linuxmint/discussions/936",
    checked: "statement",
    evidence: "Project statement; ISO package list not checked.",
  },
  {
    key: "popos",
    level: "none",
    detail: "No telemetry or error reports. It only contacts System76, Ubuntu and Flathub to check for updates and to test the network connection, and System76 says nothing from those requests is stored.",
    source: "https://system76.com/privacy",
    checked: "build",
    evidence: "pop-os/iso config/pop-os/24.04.mk and pop-os/desktop debian/control: no ubuntu-report, ubuntu-insights, popularity-contest, apport or whoopsie; snapd and ubuntu-advantage-tools removed.",
  },
  {
    key: "elementary",
    level: "none",
    detail: "elementary says it collects no data from elementary OS.",
    source: "https://elementary.io/privacy",
    checked: "build",
    evidence: "elementary/seeds desktop seed: no telemetry or crash-report packages.",
  },
  {
    key: "arch",
    level: "none",
    detail: "Nothing is sent by default. The optional pkgstats package reports installed packages only if you install it.",
    source: "https://wiki.archlinux.org/title/Pkgstats",
    checked: "build",
    evidence: "archiso releng packages.x86_64 and archinstall installer.py: pkgstats not installed.",
  },
  {
    key: "ubuntu",
    level: "opt-in",
    detail: "The installer asks whether to share anonymous system data (Ubuntu Insights); if you decline, only an opt-out flag is sent. When an app crashes, Ubuntu asks before sending an error report.",
    source: "https://discourse.ubuntu.com/t/ubuntu-insights-how-telemetry-is-changing-on-ubuntu-desktop/73442",
    checked: "build",
    evidence: "ubuntu-seeds desktop-minimal: ubuntu-report, ubuntu-insights, apport-gtk, whoopsie; /etc/default/apport enabled=1; error tracker design: crash prompt by default.",
  },
  {
    key: "debian",
    level: "opt-in",
    detail: "The installer asks whether to join the package usage survey (popularity-contest). It's off unless you agree.",
    source: "https://popcon.debian.org/",
    checked: "build",
    evidence: "popularity-contest debian/templates: participate Default: false.",
  },
  {
    key: "fedora",
    level: "counting",
    detail: "Package updates include an anonymous weekly \"countme\" flag so Fedora can estimate how many systems are in use. No ID or package list is sent. A crash reporter (ABRT) is also installed; its sending is under Settings, Privacy, Diagnostics.",
    turnOff: "Set countme=0 in each repo file under /etc/yum.repos.d/.",
    source: "https://fedoraproject.org/wiki/Changes/DNF_Better_Counting",
    checked: "build",
    evidence: "fedora-repos fedora.repo and fedora-updates.repo: countme=1.",
  },
  {
    key: "bazzite",
    level: "counting",
    detail: "Like Fedora's image-based systems, a timer sends an anonymous \"countme\" ping to estimate the number of systems.",
    turnOff: "Run: systemctl mask --now rpm-ostree-countme.timer",
    source: "https://coreos.github.io/rpm-ostree/countme/",
    checked: "build",
    evidence: "rpm-ostree countme timer docs; ublue-os/countme publishes Bazzite counts from it.",
  },
  {
    key: "aurora",
    level: "counting",
    detail: "Like Fedora's image-based systems, a timer sends an anonymous \"countme\" ping to estimate the number of systems.",
    turnOff: "Run: systemctl mask --now rpm-ostree-countme.timer",
    source: "https://coreos.github.io/rpm-ostree/countme/",
    checked: "build",
    evidence: "rpm-ostree countme timer docs; ublue-os/countme publishes Aurora counts from it.",
  },
  {
    key: "opensuse",
    level: "counting",
    detail: "The package manager sends a random installation ID with every download from openSUSE's servers so it can count installs.",
    turnOff: "Empty the file /var/lib/zypp/AnonymousUniqueId (don't delete it).",
    source: "https://en.opensuse.org/openSUSE:Statistics",
    checked: "build",
    evidence: "libzypp MediaNetworkCommonHandler.cc and commitpackagepreloader.cc: X-ZYpp-AnonymousId header sent to download.opensuse.org and cdn.opensuse.org.",
  },
  {
    key: "zorin",
    level: "counting",
    detail: "An hourly \"census\" ping sends an anonymous installation ID and OS version to count users.",
    turnOff: "Choose \"Don't participate in the census\" in the installer, or run: sudo apt remove zorin-os-census",
    source: "https://zorin.com/legal/privacy/",
    checked: "statement",
    evidence: "Zorin privacy policy (census section).",
  },
];

const BY_KEY = new Map(TELEMETRY.map((t) => [t.key, t]));

export function telemetryFor(key: string): TelemetryInfo | null {
  return BY_KEY.get(key) ?? null;
}

export const TELEMETRY_LABEL: Record<TelemetryLevel, string> = {
  none: "None",
  "opt-in": "Off unless you opt in",
  counting: "Anonymous count, on by default",
};

/** True when nothing is sent unless the user chooses to. */
export const sendsNothingByDefault = (t: TelemetryInfo | null) => t != null && t.level !== "counting";
