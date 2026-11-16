/**
 * Reference cards for ranked systems that aren't general desktop Linux
 * distros: BSDs, ChromeOS, phone and appliance systems, servers. They are
 * never quiz picks (picker-profiles.ts covers those). Each card says what the
 * system is for and where to start, from the project's own pages (`source`).
 * Checked 2026-11-15; keep claims plain and checkable.
 */
export type ReferenceKind = "bsd" | "unix-like" | "chromeos" | "gaming" | "mobile" | "server" | "nas" | "enterprise" | "media" | "rescue" | "apple" | "privacy";

export const REFERENCE_KIND_LABEL: Record<ReferenceKind, string> = {
  bsd: "BSD operating system",
  "unix-like": "Non-Linux operating system",
  chromeos: "ChromeOS family",
  gaming: "Gaming system",
  mobile: "Phone operating system",
  server: "Server and virtualization platform",
  nas: "Network storage system",
  enterprise: "Enterprise Linux",
  media: "Media-centre system",
  rescue: "Rescue and repair system",
  apple: "Linux for Apple Silicon Macs",
  privacy: "Privacy and anonymity system",
};

export interface ReferenceProfile {
  key: string;
  kind: ReferenceKind;
  /** Not a Linux distribution at all (BSDs, Haiku, ReactOS). */
  notLinux?: true;
  /** One sentence: what it is. */
  summary: string;
  /** Who it's for, as "you …" clauses (shown as "Good for you if"). */
  goodFor: string[];
  /** One sentence of caution for desktop switchers. */
  notFor: string;
  /** Where to start: the project's own download or install page. */
  start: { label: string; href: string };
  /** Page the facts were checked against. */
  source: string;
  /** For readers who want a regular desktop distro instead. */
  instead?: { slug: string; why: string };
}

const R = (p: ReferenceProfile) => p;

export const REFERENCE_PROFILES: ReferenceProfile[] = [
  R({ key: "freebsd", kind: "bsd", notLinux: true, summary: "A free Unix-like operating system descended from BSD, developed as one complete system (kernel and base tools together).", goodFor: ["you run servers, routers or storage and want a coherent, well-documented base system", "you want ZFS and jails built in"], notFor: "Desktop setup is manual and some Linux-only apps and drivers aren't available.", start: { label: "Get FreeBSD", href: "https://www.freebsd.org/where/" }, source: "https://www.freebsd.org/about/", instead: { slug: "ghostbsd", why: "FreeBSD with a ready-made desktop" } }),
  R({ key: "openbsd", kind: "bsd", notLinux: true, summary: "A free BSD operating system that puts security, correctness and simplicity first.", goodFor: ["you run firewalls, routers or small servers", "you value careful code review and secure defaults over the newest features"], notFor: "Hardware and app support on the desktop is narrower than on Linux.", start: { label: "Install OpenBSD", href: "https://www.openbsd.org/faq/faq4.html" }, source: "https://www.openbsd.org/" }),
  R({ key: "netbsd", kind: "bsd", notLinux: true, summary: "A free BSD operating system known for running on a very wide range of hardware.", goodFor: ["you work with unusual, old or embedded hardware", "you want a small, portable Unix-like system"], notFor: "It's a general-purpose base, not a ready-made desktop.", start: { label: "NetBSD releases", href: "https://www.netbsd.org/releases/" }, source: "https://www.netbsd.org/about/" }),
  R({ key: "ghostbsd", kind: "bsd", notLinux: true, summary: "A desktop system based on FreeBSD with a graphical installer and a preconfigured MATE desktop.", goodFor: ["you want to try FreeBSD with a desktop already set up"], notFor: "Some Linux apps, games and drivers aren't available on FreeBSD.", start: { label: "Download GhostBSD", href: "https://www.ghostbsd.org/download" }, source: "https://www.ghostbsd.org/" }),
  R({ key: "haiku", kind: "unix-like", notLinux: true, summary: "A free operating system inspired by BeOS, built from scratch as a fast, simple personal desktop.", goodFor: ["you're curious about an alternative desktop OS", "you want something lightweight to experiment with"], notFor: "It's in beta and runs far fewer apps than Linux; not a replacement for a daily system.", start: { label: "Get Haiku", href: "https://www.haiku-os.org/get-haiku/" }, source: "https://www.haiku-os.org/about/" }),
  R({ key: "reactos", kind: "unix-like", notLinux: true, summary: "A free operating system that aims to run Windows apps and drivers, written from scratch.", goodFor: ["you're interested in an open-source Windows-compatible OS"], notFor: "It's alpha software; use it in a virtual machine, not as your main system.", start: { label: "Download ReactOS", href: "https://reactos.org/download/" }, source: "https://reactos.org/what-is-reactos/", instead: { slug: "zorin", why: "a stable Linux desktop that feels like Windows" } }),
  R({ key: "chromeos", kind: "chromeos", summary: "Google's operating system for Chromebooks, built around the Chrome browser and web apps. ChromeOS Flex installs it on many older PCs and Macs.", goodFor: ["you mostly use the web and want a low-maintenance computer", "you want to give an older PC a second life with ChromeOS Flex"], notFor: "It's proprietary and tied to a Google account; Linux apps run in an optional container.", start: { label: "ChromeOS Flex", href: "https://chromeos.google/products/chromeos-flex/" }, source: "https://chromeos.google/products/chromeos-flex/", instead: { slug: "mint", why: "a full Linux desktop for an older PC" } }),
  R({ key: "fydeos", kind: "chromeos", summary: "An operating system based on the open-source ChromiumOS, made for PCs and tablets.", goodFor: ["you like the ChromeOS way of working on hardware Google doesn't support"], notFor: "It works much like ChromeOS, not like a traditional Linux desktop.", start: { label: "Download FydeOS", href: "https://fydeos.io/download/" }, source: "https://fydeos.io/" }),
  R({ key: "steamos", kind: "gaming", summary: "Valve's gaming operating system, based on Arch Linux, that runs the Steam Deck and other 'Powered by SteamOS' devices.", goodFor: ["you have a Steam Deck, Steam Machine or Legion Go S", "you want a console-style Steam experience"], notFor: "Valve supports it on a few devices; for a gaming desktop PC a gaming distro is easier.", start: { label: "About SteamOS", href: "https://store.steampowered.com/steamos" }, source: "https://store.steampowered.com/steamos", instead: { slug: "bazzite", why: "a SteamOS-like gaming system for desktops and handhelds" } }),
  R({ key: "grapheneos", kind: "mobile", summary: "A privacy- and security-focused operating system for phones, based on Android's open-source code.", goodFor: ["you have a supported Google Pixel phone", "you want a hardened phone OS without Google services by default"], notFor: "It's for phones, not desktop or laptop computers.", start: { label: "Install GrapheneOS", href: "https://grapheneos.org/install/" }, source: "https://grapheneos.org/" }),
  R({ key: "redhat", kind: "enterprise", summary: "Red Hat's commercial Linux distribution for businesses, with paid support and a long support life per release.", goodFor: ["your workplace runs Red Hat or needs vendor-certified software", "you're learning skills for Linux admin jobs"], notFor: "Updates need a subscription; there's a free individual developer subscription.", start: { label: "Red Hat Enterprise Linux", href: "https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux" }, source: "https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux", instead: { slug: "alma", why: "a free, RHEL-compatible distro" } }),
  R({ key: "centos", kind: "enterprise", summary: "CentOS Stream is a continuously delivered distro that tracks just ahead of Red Hat Enterprise Linux. The classic CentOS Linux has ended.", goodFor: ["you want to see and test what's coming in the next RHEL release"], notFor: "It isn't the stable RHEL rebuild CentOS used to be; for that, pick a compatible alternative.", start: { label: "Get CentOS Stream", href: "https://www.centos.org/download/" }, source: "https://www.centos.org/download/", instead: { slug: "rocky", why: "a free, stable RHEL-compatible distro" } }),
  R({ key: "oracle", kind: "enterprise", summary: "Oracle's free-to-use Linux distribution, compatible with Red Hat Enterprise Linux, with optional paid support.", goodFor: ["you run Oracle software or Oracle Cloud", "you want a RHEL-compatible server distro you can download freely"], notFor: "It's built for servers rather than a home desktop.", start: { label: "Oracle Linux downloads", href: "https://yum.oracle.com/oracle-linux-isos.html" }, source: "https://www.oracle.com/linux/" }),
  R({ key: "proxmox", kind: "server", summary: "Proxmox VE is a free, open-source platform for running virtual machines and containers on your own server, managed from a web interface.", goodFor: ["you're building a home lab or small server", "you want to run several systems on one machine"], notFor: "It's a server platform, not a desktop; you manage it from another computer's browser.", start: { label: "Proxmox downloads", href: "https://www.proxmox.com/en/downloads" }, source: "https://www.proxmox.com/en/products/proxmox-virtual-environment/overview" }),
  R({ key: "smartos", kind: "server", summary: "A free hypervisor based on illumos (a Solaris descendant) that boots from USB and runs containers and virtual machines.", goodFor: ["you run servers and want a lightweight, container-first hypervisor"], notFor: "It's for servers only, and it isn't Linux.", start: { label: "Download SmartOS", href: "https://docs.smartos.org/download-smartos/" }, source: "https://docs.smartos.org/" }),
  R({ key: "truenas", kind: "nas", summary: "A storage operating system built on ZFS for file sharing, backups and apps on a home or office server.", goodFor: ["you're building a NAS or home file server", "you want ZFS data protection managed from a web interface"], notFor: "It turns a machine into a storage server; it's not a desktop.", start: { label: "Download TrueNAS", href: "https://www.truenas.com/download/" }, source: "https://www.truenas.com/truenas-community-edition/" }),
  R({ key: "unraid", kind: "nas", summary: "A paid operating system for home servers that pools mixed-size drives and runs apps and virtual machines.", goodFor: ["you want an easy home server with drives of different sizes", "you want to run media and backup apps from a web interface"], notFor: "It needs a paid licence and runs as a server, not a desktop.", start: { label: "Get Unraid", href: "https://unraid.net/download" }, source: "https://unraid.net/" }),
  R({ key: "openmediavault", kind: "nas", summary: "A free NAS system based on Debian, managed from a web interface, for file sharing on small servers and single-board computers.", goodFor: ["you're turning a small PC or Raspberry Pi into a file server"], notFor: "It's a storage server, not a desktop.", start: { label: "Download openmediavault", href: "https://www.openmediavault.org/download.html" }, source: "https://www.openmediavault.org/" }),
  R({ key: "libreelec", kind: "media", summary: "A small Linux system that boots straight into the Kodi media centre.", goodFor: ["you're building a media centre for a TV on a PC, Raspberry Pi or similar box"], notFor: "It runs Kodi only; it isn't a general-purpose computer.", start: { label: "Download LibreELEC", href: "https://libreelec.tv/downloads/" }, source: "https://libreelec.tv/" }),
  R({ key: "systemrescue", kind: "rescue", summary: "A live Linux system for repairing computers and recovering data after a crash, run from a USB stick.", goodFor: ["you need to fix a computer that won't boot or rescue files from it"], notFor: "It's a toolkit you boot when needed, not something to install.", start: { label: "Download SystemRescue", href: "https://www.system-rescue.org/Download/" }, source: "https://www.system-rescue.org/" }),
  R({ key: "finnix", kind: "rescue", summary: "A small live Linux system based on Debian, for system administrators and recovery work from the command line.", goodFor: ["you're comfortable in a terminal and need a quick rescue or admin toolkit"], notFor: "It has no desktop and isn't meant to be installed.", start: { label: "Get Finnix", href: "https://www.finnix.org/" }, source: "https://www.finnix.org/" }),
  R({ key: "asahi", kind: "apple", summary: "The Asahi Linux project ports Linux to Apple Silicon Macs; its main release is Fedora Asahi Remix.", goodFor: ["you have an Apple Silicon Mac and want to run Linux on it"], notFor: "Model support varies; check your exact Mac and the features you need first.", start: { label: "Fedora Asahi Remix", href: "https://asahilinux.org/fedora/" }, source: "https://asahilinux.org/" }),
  R({ key: "whonix", kind: "privacy", summary: "A system for anonymity that sends all traffic through Tor, run as virtual machines inside another operating system.", goodFor: ["you need strong anonymity online", "you're comfortable running virtual machines"], notFor: "Tor makes browsing slower and it isn't a normal everyday desktop.", start: { label: "Download Whonix", href: "https://www.whonix.org/wiki/Download" }, source: "https://www.whonix.org/", instead: { slug: "tails", why: "an anonymity system that runs from a USB stick" } }),
];

const BY_KEY = new Map(REFERENCE_PROFILES.map((p) => [p.key, p]));
export const referenceFor = (key: string): ReferenceProfile | null => BY_KEY.get(key) ?? null;

/** Written pros and cons, else a reference card's "good for" and caution, for side-by-side pages. */
export function compareNotes(key: string, notes: (k: string) => { key: string; pros: string[]; cons: string[] } | null) {
  const own = notes(key);
  if (own) return own;
  const r = referenceFor(key);
  return r ? { key, pros: r.goodFor.map((g) => g.charAt(0).toUpperCase() + g.slice(1)), cons: [r.notFor.replace(/\.$/, "")] } : null;
}
