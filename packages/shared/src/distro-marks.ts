/**
 * Distro logo manifest (identify-only use: small, unmodified marks next to the
 * name). Path data comes from the simple-icons package (CC0-1.0); each mark
 * stays a trademark of its project. `source` is where simple-icons took the
 * mark from. A distro without an entry shows a monogram instead.
 */
export interface DistroMarkEntry {
  /** simple-icons slug */
  icon: string;
  /** simple-icons title, kept to spot mismatches in review */
  title: string;
  /** brand colour, hex without # */
  hex: string;
  source: string;
}

/** simple-icons version the marks were taken from; bump together with the dependency. */
export const MARKS_FROM = "simple-icons 16.37.0 (checked 2026-11-16)";

export const DISTRO_MARKS: Record<string, DistroMarkEntry> = {
  "alma": { icon: "almalinux", title: "AlmaLinux", hex: "000000", source: "https://almalinux.org" },
  "alpine": { icon: "alpinelinux", title: "Alpine Linux", hex: "0D597F", source: "https://alpinelinux.org" },
  "arch": { icon: "archlinux", title: "Arch Linux", hex: "1793D1", source: "https://www.archlinux.org/art" },
  "artix": { icon: "artixlinux", title: "Artix Linux", hex: "10A0CC", source: "https://gitea.artixlinux.org/artix/artwork/src/commit/256432e3d06b3e9024bfd6912768e80281ea3746/icons/logo-gray.svg" },
  "asahi": { icon: "asahilinux", title: "Asahi Linux", hex: "A61200", source: "https://github.com/AsahiLinux/artwork/blob/292637c9658c1491ddc1128fb6134aec01d904dd/logos/svg/AsahiLinux_logomark_mono.svg" },
  "cachyos": { icon: "cachyos", title: "CachyOS", hex: "00AA88", source: "https://commons.wikimedia.org/wiki/File:CachyOS_Logo.svg" },
  "centos": { icon: "centos", title: "CentOS", hex: "262577", source: "https://wiki.centos.org/ArtWork/Brand/Logo" },
  "debian": { icon: "debian", title: "Debian", hex: "A81D33", source: "https://www.debian.org/logos" },
  "deepin": { icon: "deepin", title: "deepin", hex: "007CFF", source: "https://commons.wikimedia.org/wiki/File:Deepin_logo.svg" },
  "devuan": { icon: "devuan", title: "Devuan", hex: "004489", source: "https://git.devuan.org/devuan/documentation/src/commit/f4931e70e17f043c2824d591bba7c7f70ed583b6/art/graphics/logo/devuan-emblem.svg" },
  "elementary": { icon: "elementary", title: "elementary", hex: "64BAFF", source: "https://elementary.io/brand" },
  "endeavour": { icon: "endeavouros", title: "EndeavourOS", hex: "7F7FFF", source: "https://github.com/endeavouros-team/endeavouros-theming/blob/135f642c980ed8d8fc212783eb478f96226f6c72/endeavouros-logo-text.svg" },
  "fedora": { icon: "fedora", title: "Fedora", hex: "51A2DA", source: "https://docs.fedoraproject.org/en-US/project/brand/" },
  "freebsd": { icon: "freebsd", title: "FreeBSD", hex: "AB2B28", source: "https://www.freebsdfoundation.org/about/project/" },
  "garuda": { icon: "garudalinux", title: "Garuda Linux", hex: "8839EF", source: "https://gitlab.com/garuda-linux/themes-and-settings/artwork/garuda-icons/-/blob/aab26625fe01479ebc3a252103fca723baca9e88/usr/share/icons/garuda/distributor-logo-garuda-outline.svg" },
  "gentoo": { icon: "gentoo", title: "Gentoo", hex: "54487A", source: "https://wiki.gentoo.org/wiki/Project:Artwork/Artwork#Variations_of_the_.22g.22_logo" },
  "grapheneos": { icon: "grapheneos", title: "GrapheneOS", hex: "0053A3", source: "https://github.com/GrapheneOS/branding-extra/blob/5cc2e4b781345b89457d8ef814bd1aae56af289f/simple.svg" },
  "kali": { icon: "kalilinux", title: "Kali Linux", hex: "557C94", source: "https://www.kali.org/docs/policy/trademark/" },
  "kdeneon": { icon: "kdeneon", title: "KDE neon", hex: "3DC08D", source: "https://community.kde.org/Neon" },
  "kubuntu": { icon: "kubuntu", title: "Kubuntu", hex: "0079C1", source: "https://kubuntu.org" },
  "lubuntu": { icon: "lubuntu", title: "Lubuntu", hex: "0068C8", source: "https://lubuntu.net" },
  "manjaro": { icon: "manjaro", title: "Manjaro", hex: "35BFA4", source: "https://manjaro.org" },
  "mint": { icon: "linuxmint", title: "Linux Mint", hex: "86BE43", source: "https://github.com/linuxmint/brand-logo/blob/540ac3b08e987866d77a340f557f994c988ac2ae/ring-mono-green.svg" },
  "mx": { icon: "mxlinux", title: "MX Linux", hex: "000000", source: "https://mxlinux.org/art/" },
  "netbsd": { icon: "netbsd", title: "NetBSD", hex: "FF6600", source: "https://www.netbsd.org" },
  "nixos": { icon: "nixos", title: "NixOS", hex: "5277C3", source: "https://brand.nixos.org/logos/nixos-logomark-black-flat-minimal.svg" },
  "nobara": { icon: "nobaralinux", title: "Nobara Linux", hex: "000000", source: "https://wiki.nobaraproject.org" },
  "omarchy": { icon: "omarchy", title: "Omarchy", hex: "9ECE6A", source: "https://omarchy.org" },
  "openbsd": { icon: "openbsd", title: "OpenBSD", hex: "F2CA30", source: "https://en.wikipedia.org/wiki/OpenBSD" },
  "openmediavault": { icon: "openmediavault", title: "openmediavault", hex: "5DACDF", source: "https://github.com/openmediavault/openmediavault/blob/12f8ef70f19f967733b744d6fb6156a4181f1ddc/deb/openmediavault/workbench/src/favicon.svg" },
  "opensuse": { icon: "opensuse", title: "openSUSE", hex: "73BA25", source: "https://github.com/openSUSE/artwork/blob/33e94aa76837c09f03d1712705949b71a246a53b/logos/buttons/button-colour.svg" },
  "opnsense": { icon: "opnsense", title: "OPNsense", hex: "E44A20", source: "https://github.com/opnsense/core/blob/f4b69b9b565d2747eb40d7d23e060f4a3c81a071/src/opnsense/www/themes/opnsense/build/images/icon-logo.svg" },
  "osgeo": { icon: "osgeo", title: "OSGeo", hex: "4CB05B", source: "https://www.osgeo.org" },
  "osmc": { icon: "osmc", title: "OSMC", hex: "17394A", source: "https://github.com/osmc/website/tree/e7d0d8002660c979ae5119e28d1c69c893ac9f76/content/themes/osmc/assets/img/logo" },
  "parrot": { icon: "parrotsecurity", title: "Parrot Security", hex: "15E0ED", source: "https://gitlab.com/parrotsec/project/documentation/-/blob/d1d426b9cb3ea0efd16a2b34056c1ebb21bb9af9/static/img/parrot-logo.svg" },
  "pfsense": { icon: "pfsense", title: "pfSense", hex: "212121", source: "https://www.pfsense.org" },
  "popos": { icon: "popos", title: "Pop!_OS", hex: "48B9C7", source: "https://github.com/system76/brand/blob/7a31740b54f929b62a165baa61dfb0b5164261e8/Pop_OS%20branding/Pop_icon.svg" },
  "proxmox": { icon: "proxmox", title: "Proxmox", hex: "E57000", source: "https://www.proxmox.com/en/news/media-kit" },
  "qubes": { icon: "qubesos", title: "Qubes OS", hex: "3874D8", source: "https://github.com/QubesOS/qubes-attachment/blob/ed7e552eb8a5fca4e099361d137793d3551b3968/icons/qubes-logo-home.svg" },
  "raspios": { icon: "raspberrypi", title: "Raspberry Pi", hex: "A22846", source: "https://www.raspberrypi.org/trademark-rules" },
  "reactos": { icon: "reactos", title: "ReactOS", hex: "0088CC", source: "https://github.com/reactos/press-media/tree/48089e09e0c7e828f1eb81e5ea0d8da85ec41dc3" },
  "redhat": { icon: "redhat", title: "Red Hat", hex: "EE0000", source: "https://www.redhat.com/en/about/brand/new-brand/details" },
  "redox": { icon: "redox", title: "Redox", hex: "000000", source: "https://github.com/redox-os/assets/blob/4935a777cd7aa44323d3c263b1e0bb4ae864a027/logos/redox/vectorized_logo.svg" },
  "rocky": { icon: "rockylinux", title: "Rocky Linux", hex: "10B981", source: "https://github.com/rocky-linux/branding/blob/94e97dd30b87d909cc4f6a6838a2926f77f9ac47/logo/src/icon-black.svg" },
  "slackware": { icon: "slackware", title: "Slackware", hex: "000000", source: "https://en.wikipedia.org/wiki/Slackware" },
  "sle": { icon: "suse", title: "SUSE", hex: "0C322C", source: "https://brand.suse.com" },
  "solus": { icon: "solus", title: "Solus", hex: "5294E2", source: "https://getsol.us/branding/" },
  "tails": { icon: "tails", title: "Tails", hex: "56347C", source: "https://tails.boum.org/contribute/how/promote/material/logo/" },
  "talos": { icon: "talos", title: "Talos", hex: "FF7300", source: "https://github.com/siderolabs/talos/blob/e3fda049fee62f3c5cef4ae08eaf848826a6dbed/website/assets/icons/logo.svg" },
  "truenas": { icon: "truenas", title: "TrueNAS", hex: "0095D5", source: "https://www.truenas.com" },
  "ubuntu": { icon: "ubuntu", title: "Ubuntu", hex: "E95420", source: "https://design.ubuntu.com/resources" },
  "ubuntumate": { icon: "ubuntumate", title: "Ubuntu MATE", hex: "84A454", source: "https://ubuntu-mate.org" },
  "unraid": { icon: "unraid", title: "Unraid", hex: "F15A2C", source: "https://unraid.net" },
  "void": { icon: "voidlinux", title: "Void Linux", hex: "478061", source: "https://alpha.de.repo.voidlinux.org/logos/void-dark2.svg" },
  "xubuntu": { icon: "xubuntu", title: "Xubuntu", hex: "0044AA", source: "https://commons.wikimedia.org/wiki/File:Xubuntu_Icon.svg" },
  "yunohost": { icon: "yunohost", title: "YunoHost", hex: "000000", source: "https://github.com/YunoHost/doc/blob/0157b052481407b3c06cc2892de225f14c42520b/images/ynh_logo_black.svg" },
  "zorin": { icon: "zorin", title: "Zorin", hex: "15A6F0", source: "https://zorin.com/press" },
};

export interface MarkStyle {
  /** tile background, "#rrggbb" */
  bg: string;
  /** glyph colour that reads on the tile */
  fg: "#fff" | "#111";
}

/** Relative luminance (WCAG) of a 6-digit hex colour. */
export function luminance(hex: string): number {
  const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

/** The glyph sits on a tile of the brand colour, white or near-black, whichever contrasts more. */
export function markStyle(slug: string): MarkStyle | null {
  const m = DISTRO_MARKS[slug];
  if (!m) return null;
  const l = luminance(m.hex);
  const onWhite = 1.05 / (l + 0.05);
  const onDark = (l + 0.05) / (luminance("111111") + 0.05);
  return { bg: `#${m.hex}`, fg: onWhite >= onDark ? "#fff" : "#111" };
}

/** First letter or digit of the name, for distros without a mark. */
export function monogram(name: string): string {
  return (name.match(/[\p{L}\p{N}]/u)?.[0] ?? "?").toUpperCase();
}

export const markId = (slug: string) => `m-${slug}`;

export interface DistroImageEntry {
  /** file under public/marks/, a 128 px square PNG rendered from the source */
  file: string;
  /** Wikimedia Commons file page, or the official URL the icon was taken from */
  source: string;
  license: string;
  author: string;
}

/**
 * Full-colour square icons for distros simple-icons doesn't cover: from Wikimedia
 * Commons (free licence) or, failing that, the project's own website or GitHub
 * organization (trademark, identify-only). Shown as-is (no tile). SVG sources were rendered to PNG so no SVG from
 * outside the project is served.
 */
export const DISTRO_IMAGES: Record<string, DistroImageEntry> = {
  chimera: { file: "chimera.png", source: "https://commons.wikimedia.org/wiki/File:Chimera_Linux_logo.svg", license: "CC BY-SA 4.0", author: "Cura Sylfaen for the Chimera Linux project" },
  kaos: { file: "kaos.png", source: "https://commons.wikimedia.org/wiki/File:KaOS_logo_2015.svg", license: "GPL", author: "KaOS" },
  midnightbsd: { file: "midnightbsd.png", source: "https://commons.wikimedia.org/wiki/File:MidnightBSDLogo.svg", license: "CC BY 3.0", author: "Soursquirrel" },
  openmandriva: { file: "openmandriva.png", source: "https://commons.wikimedia.org/wiki/File:OpenMandriva_Logo.svg", license: "CC BY-SA 4.0", author: "Zacharpolis" },
  pclinuxos: { file: "pclinuxos.png", source: "https://commons.wikimedia.org/wiki/File:PCLinuxOS_logo.svg", license: "CC BY-SA 3.0", author: "David Smid" },
  porteus: { file: "porteus.png", source: "https://commons.wikimedia.org/wiki/File:Mainlogoporteus.png", license: "GPL", author: "Blaze" },
  puppy: { file: "puppy.png", source: "https://commons.wikimedia.org/wiki/File:Puppy_logo.svg", license: "Attribution", author: "afgs, puppylinux.com" },
  sparky: { file: "sparky.png", source: "https://commons.wikimedia.org/wiki/File:SparkyLinux-logo-200px.png", license: "GPL", author: "Pavroo" },
  ubuntucinnamon: { file: "ubuntucinnamon.png", source: "https://commons.wikimedia.org/wiki/File:UbuntuCinnamon.png", license: "CC BY-SA 4.0", author: "Ubuntu Cinnamon Remix" },
  // Official icons from each project (own website or GitHub organization), checked 2026-11-16.
  archbang: { file: "archbang.png", source: "https://archbang.org/wp-content/uploads/2026/06/archbang-512-300x300.png", license: "Trademark, identify-only", author: "ArchBANG project (Official website icon)" },
  armbian: { file: "armbian.png", source: "https://www.armbian.com/favicon.ico?favicon.0d81kuff2t8-z.ico", license: "Trademark, identify-only", author: "Armbian project (Official website icon)" },
  avlinux: { file: "avlinux.png", source: "https://www.bandshed.net/wordpress/wp-content/uploads/2022/02/cropped-AVL-MXE-Waveform-O-512px.png", license: "Trademark, identify-only", author: "AV Linux project (Official website icon)" },
  bazzite: { file: "bazzite.png", source: "https://bazzite.gg/content/uploads/2024/02/apple.png", license: "Trademark, identify-only", author: "Bazzite project (Official website icon)" },
  chromeos: { file: "chromeos.png", source: "https://github.com/chromeos.png?size=256", license: "Trademark, identify-only", author: "ChromeOS project (GitHub organization avatar)" },
  finnix: { file: "finnix.png", source: "https://github.com/finnix.png?size=256", license: "Trademark, identify-only", author: "Finnix project (GitHub organization avatar)" },
  fydeos: { file: "fydeos.png", source: "https://github.com/FydeOS.png?size=256", license: "Trademark, identify-only", author: "FydeOS project (GitHub organization avatar)" },
  ghostbsd: { file: "ghostbsd.png", source: "https://github.com/ghostbsd.png?size=256", license: "Trademark, identify-only", author: "GhostBSD project (GitHub organization avatar)" },
  guixsd: { file: "guixsd.png", source: "https://guix.gnu.org/themes/initial/img/icon.png", license: "Trademark, identify-only", author: "Guix System project (Official website icon)" },
  iode: { file: "iode.png", source: "https://iode.tech/wp-content/uploads/2024/06/cropped-ic_big_io-192x192.png", license: "Trademark, identify-only", author: "iod\u00e9OS project (Official website icon)" },
  libreelec: { file: "libreelec.png", source: "https://github.com/LibreELEC.png?size=256", license: "Trademark, identify-only", author: "LibreELEC project (GitHub organization avatar)" },
  lite: { file: "lite.png", source: "https://github.com/linuxlite.png?size=256", license: "Trademark, identify-only", author: "Lite project (GitHub organization avatar)" },
  pardus: { file: "pardus.png", source: "https://pardus.org.tr/wp-content/uploads/2019/08/Pardus-04-300x300.png", license: "Trademark, identify-only", author: "Pardus project (Official website icon)" },
  peppermint: { file: "peppermint.png", source: "https://peppermintos.com/wp-content/uploads/2020/07/cropped-Peppermint-OS-Logo-192x192.png", license: "Trademark, identify-only", author: "Peppermint project (Official website icon)" },
  pureos: { file: "pureos.png", source: "https://pureos.net/images/favicon-192x192.png", license: "Trademark, identify-only", author: "PureOS project (Official website icon)" },
  q4os: { file: "q4os.png", source: "https://github.com/q4os.png?size=256", license: "Trademark, identify-only", author: "Q4OS project (GitHub organization avatar)" },
  slitaz: { file: "slitaz.png", source: "https://slitaz.org/apple-touch-icon.png", license: "Trademark, identify-only", author: "SliTaz project (Official website icon)" },
  ubuntubudgie: { file: "ubuntubudgie.png", source: "https://ubuntubudgie.org/apple-touch-icon.png", license: "Trademark, identify-only", author: "Ubuntu Budgie project (Official website icon)" },
  ubuntukylin: { file: "ubuntukylin.png", source: "https://github.com/ubuntukylin.png?size=256", license: "Trademark, identify-only", author: "Ubuntu Kylin project (GitHub organization avatar)" },
  whonix: { file: "whonix.png", source: "https://www.whonix.org/apple-touch-icon.png", license: "Trademark, identify-only", author: "Whonix project (Official website icon)" },
};
