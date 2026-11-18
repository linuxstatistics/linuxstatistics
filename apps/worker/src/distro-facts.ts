import type { DesktopId, InitSystem, PackageManager } from "@linux-statistics/shared";

export interface CuratedFacts {
  /** What the main download ships with; null when the project makes you choose or ships none. */
  default: DesktopId | null;
  /** Other desktops the project itself offers: editions, spins, live images, installer choices. */
  others?: DesktopId[];
  /** Official flavours tracked as their own distro, by desktop. */
  editions?: { desktop: DesktopId; slug: string }[];
  pkg: PackageManager | null;
  init: InitSystem | null;
  /** The project page that backs the desktop facts. */
  source: string;
}

const UBUNTU_FLAVOURS: CuratedFacts["editions"] = [
  { desktop: "kde-plasma", slug: "kubuntu" },
  { desktop: "xfce", slug: "xubuntu" },
  { desktop: "lxqt", slug: "lubuntu" },
  { desktop: "mate", slug: "ubuntumate" },
  { desktop: "budgie", slug: "ubuntubudgie" },
];
const FLAVORS = "https://ubuntu.com/desktop/flavors";

/**
 * Desktop, package manager and init for every profiled distro, keyed by our
 * slug, each checked on the project's own pages on 2026-11-18. Curated values
 * always win; Wikidata only fills fields left empty here (and never the
 * default desktop). A null default with a list of others means the project
 * asks you to pick. Leave a value null rather than guess.
 */
export const CURATED_FACTS: Record<string, CuratedFacts> = {
  mint: { default: "cinnamon", others: ["mate", "xfce"], pkg: "apt", init: "systemd", source: "https://linuxmint.com/download.php" },
  zorin: { default: "gnome", others: ["xfce"], pkg: "apt", init: "systemd", source: "https://zorin.com/os/details" },
  ubuntu: { default: "gnome", editions: UBUNTU_FLAVOURS, pkg: "apt", init: "systemd", source: FLAVORS },
  popos: { default: "cosmic", pkg: "apt", init: "systemd", source: "https://system76.com/pop/download/" },
  fedora: { default: "gnome", others: ["kde-plasma", "xfce", "cinnamon", "mate", "lxqt", "lxde", "budgie", "cosmic", "sway", "i3"], pkg: "dnf", init: "systemd", source: "https://fedoraproject.org/spins/" },
  debian: { default: "gnome", others: ["kde-plasma", "xfce", "cinnamon", "mate", "lxde", "lxqt"], pkg: "apt", init: "systemd", source: "https://www.debian.org/releases/stable/amd64/ch06s03.en.html" },
  mx: { default: "xfce", others: ["kde-plasma", "fluxbox"], pkg: "apt", init: "sysvinit", source: "https://mxlinux.org/download-links/" },
  cachyos: { default: null, others: ["kde-plasma", "gnome", "cosmic", "xfce", "hyprland", "niri", "sway", "i3"], pkg: "pacman", init: "systemd", source: "https://cachyos.org/download/" },
  bazzite: { default: "kde-plasma", others: ["gnome"], pkg: "rpm-ostree", init: "systemd", source: "https://bazzite.gg/" },
  nobara: { default: "kde-plasma", others: ["gnome"], pkg: "dnf", init: "systemd", source: "https://nobaraproject.org/download-nobara/" },
  endeavour: { default: null, others: ["kde-plasma", "gnome", "xfce", "cinnamon", "mate", "lxqt", "budgie", "i3"], pkg: "pacman", init: "systemd", source: "https://discovery.endeavouros.com/live-iso-tricks-tips/" },
  manjaro: { default: "kde-plasma", others: ["xfce", "gnome"], pkg: "pacman", init: "systemd", source: "https://manjaro.org/products/download/x86" },
  arch: { default: null, pkg: "pacman", init: "systemd", source: "https://archlinux.org/download/" },
  elementary: { default: "pantheon", pkg: "apt", init: "systemd", source: "https://elementary.io/" },
  opensuse: { default: null, others: ["kde-plasma", "gnome", "xfce"], pkg: "zypper", init: "systemd", source: "https://get.opensuse.org/tumbleweed/" },
  kdeneon: { default: "kde-plasma", pkg: "apt", init: "systemd", source: "https://neon.kde.org/download" },
  kubuntu: { default: "kde-plasma", pkg: "apt", init: "systemd", source: FLAVORS },
  lubuntu: { default: "lxqt", pkg: "apt", init: "systemd", source: FLAVORS },
  xubuntu: { default: "xfce", pkg: "apt", init: "systemd", source: FLAVORS },
  antix: { default: "icewm", others: ["fluxbox", "jwm", "herbstluftwm"], pkg: "apt", init: "runit", source: "https://antixlinux.com/download/" },
  q4os: { default: "kde-plasma", others: ["trinity"], pkg: "apt", init: "systemd", source: "https://www.q4os.org/downloads1.html" },
  nixos: { default: null, others: ["gnome", "kde-plasma"], pkg: "nix", init: "systemd", source: "https://nixos.org/download/" },
  void: { default: null, others: ["xfce"], pkg: "xbps", init: "runit", source: "https://voidlinux.org/download/" },
  garuda: { default: "kde-plasma", others: ["gnome", "xfce", "cinnamon", "sway", "hyprland", "i3"], pkg: "pacman", init: "systemd", source: "https://garudalinux.org/editions" },
  tails: { default: "gnome", pkg: "apt", init: "systemd", source: "https://tails.net/about/index.en.html" },
  qubes: { default: "xfce", pkg: "dnf", init: "systemd", source: "https://doc.qubes-os.org/en/latest/user/advanced-topics/kde.html" },
  kali: { default: "xfce", others: ["gnome", "kde-plasma"], pkg: "apt", init: "systemd", source: "https://www.kali.org/get-kali/" },
  alpine: { default: null, pkg: "apk", init: "openrc", source: "https://alpinelinux.org/downloads/" },
  solus: { default: "budgie", others: ["gnome", "kde-plasma", "xfce"], pkg: "eopkg", init: "systemd", source: "https://getsol.us/download/" },
  aurora: { default: "kde-plasma", pkg: "rpm-ostree", init: "systemd", source: "https://docs.getaurora.dev/" },
  bluefin: { default: "gnome", pkg: "rpm-ostree", init: "systemd", source: "https://docs.projectbluefin.io/" },
  ultramarine: { default: "kde-plasma", others: ["gnome", "xfce", "budgie"], pkg: "dnf", init: "systemd", source: "https://ultramarine-linux.org/download/" },
  pikaos: { default: null, others: ["gnome", "kde-plasma", "cosmic", "hyprland", "niri"], pkg: "apt", init: "systemd", source: "https://pika-os.com/" },
  anduin: { default: "gnome", pkg: "apt", init: "systemd", source: "https://www.anduinos.com/" },
  omarchy: { default: "hyprland", pkg: "pacman", init: "systemd", source: "https://omarchy.org/" },
  artix: { default: null, others: ["kde-plasma", "xfce", "lxqt", "lxde", "mate", "cinnamon"], pkg: "pacman", init: "openrc", source: "https://artixlinux.org/download.php" },
  tuxedo: { default: "kde-plasma", pkg: "apt", init: "systemd", source: "https://www.tuxedocomputers.com/en/TUXEDO-OS_1.tuxedo" },
  puppy: { default: null, pkg: "ppm", init: null, source: "https://puppylinux-woof-ce.github.io/" },
  pclinuxos: { default: "kde-plasma", others: ["mate", "xfce"], pkg: "dnf", init: "sysvinit", source: "https://pclosusers.com/wiki/index.php?title=Ways_to_get_PCLinuxOS" },
  sparky: { default: null, others: ["lxqt", "xfce", "mate", "kde-plasma", "openbox", "labwc"], pkg: "apt", init: "systemd", source: "https://sparkylinux.org/download/stable/" },
  mageia: { default: null, others: ["kde-plasma", "gnome", "xfce"], pkg: "dnf", init: "systemd", source: "https://www.mageia.org/en/downloads/" },
  devuan: { default: "xfce", others: ["mate", "lxde", "lxqt", "kde-plasma", "openbox"], pkg: "apt", init: "sysvinit", source: "https://www.devuan.org/get-devuan" },
  lite: { default: "xfce", pkg: "apt", init: "systemd", source: "https://www.linuxliteos.com/download.php" },
  parrot: { default: "kde-plasma", pkg: "apt", init: "systemd", source: "https://parrotsec.org/docs/configuration/desktop-environments/" },
  alma: { default: "gnome", others: ["kde-plasma", "xfce", "mate"], pkg: "dnf", init: "systemd", source: "https://almalinux.org/get-almalinux/" },
  rocky: { default: "gnome", others: ["kde-plasma"], pkg: "dnf", init: "systemd", source: "https://download.rockylinux.org/pub/rocky/10/live/x86_64/" },
  gentoo: { default: null, pkg: "portage", init: "openrc", source: "https://www.gentoo.org/get-started/about/" },
  slackware: { default: null, others: ["kde-plasma", "xfce"], pkg: "slackpkg", init: "sysvinit", source: "http://www.slackware.com/" },
  peppermint: { default: "xfce", pkg: "apt", init: "systemd", source: "https://peppermintos.com/" },
  deepin: { default: "dde", pkg: "apt", init: "systemd", source: "https://www.deepin.org/en/dde/" },
  vanilla: { default: "gnome", pkg: "apx", init: "systemd", source: "https://vanillaos.org/" },
  nitrux: { default: "hyprland", pkg: null, init: "openrc", source: "https://nxos.org/" },
  raspios: { default: "labwc", pkg: "apt", init: "systemd", source: "https://www.raspberrypi.com/documentation/computers/configuration.html" },
  dietpi: { default: null, others: ["lxde", "lxqt", "mate", "xfce"], pkg: "apt", init: "systemd", source: "https://dietpi.com/docs/software/desktop/" },
  armbian: { default: null, pkg: "apt", init: "systemd", source: "https://www.armbian.com/" },
  ubuntustudio: { default: "kde-plasma", pkg: "apt", init: "systemd", source: "https://ubuntustudio.org/" },
  avlinux: { default: "enlightenment", others: ["xfce"], pkg: "apt", init: null, source: "http://www.bandshed.net/avlinux/" },
  tinycore: { default: "flwm", pkg: "tce", init: "busybox", source: "http://tinycorelinux.net/downloads.html" },
  trisquel: { default: "mate", others: ["kde-plasma", "lxde"], pkg: "apt", init: "systemd", source: "https://trisquel.info/en/download" },
  pureos: { default: "gnome", pkg: "apt", init: "systemd", source: "https://pureos.net/" },
  endless: { default: "gnome", pkg: "flatpak", init: "systemd", source: "https://www.endlessos.org/os" },
  ubuntumate: { default: "mate", pkg: "apt", init: "systemd", source: FLAVORS },
  ubuntubudgie: { default: "budgie", pkg: "apt", init: "systemd", source: FLAVORS },
};
