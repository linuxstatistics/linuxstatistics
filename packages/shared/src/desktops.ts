import { z } from "zod";

/**
 * Desktops and window managers a distro can ship, keyed by our own IDs. Append
 * only: the IDs are stored in `distro_facts` and used in /desktop/<id>/ URLs.
 */
export const DESKTOPS = [
  "gnome",
  "kde-plasma",
  "xfce",
  "cinnamon",
  "mate",
  "cosmic",
  "budgie",
  "lxqt",
  "lxde",
  "pantheon",
  "dde",
  "trinity",
  "enlightenment",
  "unity",
  "hyprland",
  "sway",
  "i3",
  "niri",
  "openbox",
  "icewm",
  "jwm",
  "fluxbox",
  "herbstluftwm",
  "labwc",
  "flwm",
] as const;
export const desktopSchema = z.enum(DESKTOPS);
export type DesktopId = z.infer<typeof desktopSchema>;

export const DESKTOP_LABEL: Record<DesktopId, string> = {
  gnome: "GNOME",
  "kde-plasma": "KDE Plasma",
  xfce: "Xfce",
  cinnamon: "Cinnamon",
  mate: "MATE",
  cosmic: "COSMIC",
  budgie: "Budgie",
  lxqt: "LXQt",
  lxde: "LXDE",
  pantheon: "Pantheon",
  dde: "Deepin Desktop",
  trinity: "Trinity",
  enlightenment: "Enlightenment",
  unity: "Unity",
  hyprland: "Hyprland",
  sway: "Sway",
  i3: "i3",
  niri: "niri",
  openbox: "Openbox",
  icewm: "IceWM",
  jwm: "JWM",
  fluxbox: "Fluxbox",
  herbstluftwm: "herbstluftwm",
  labwc: "labwc",
  flwm: "FLWM",
};

/** Window managers and compositors rather than full desktops. */
export const WINDOW_MANAGERS: ReadonlySet<DesktopId> = new Set<DesktopId>([
  "hyprland", "sway", "i3", "niri", "openbox", "icewm", "jwm", "fluxbox", "herbstluftwm", "labwc", "flwm",
]);

/** Command-line package managers, by the command people type. */
export const PACKAGE_MANAGERS = [
  "apt",
  "dnf",
  "zypper",
  "pacman",
  "xbps",
  "apk",
  "nix",
  "guix",
  "portage",
  "eopkg",
  "rpm-ostree",
  "urpmi",
  "slackpkg",
  "apt-rpm",
  "yum",
  "tce",
  "ppm",
  "apx",
  "flatpak",
] as const;
export const packageManagerSchema = z.enum(PACKAGE_MANAGERS);
export type PackageManager = z.infer<typeof packageManagerSchema>;

export const PACKAGE_MANAGER_LABEL: Record<PackageManager, string> = {
  apt: "APT",
  dnf: "DNF",
  zypper: "zypper",
  pacman: "pacman",
  xbps: "XBPS",
  apk: "apk",
  nix: "Nix",
  guix: "Guix",
  portage: "Portage",
  eopkg: "eopkg",
  "rpm-ostree": "rpm-ostree",
  urpmi: "urpmi",
  slackpkg: "slackpkg",
  "apt-rpm": "APT-RPM",
  yum: "YUM",
  tce: "Tiny Core extensions",
  ppm: "Puppy Package Manager",
  apx: "apx",
  flatpak: "Flatpak",
};

export const INIT_SYSTEMS = ["systemd", "openrc", "runit", "sysvinit", "s6", "dinit", "busybox"] as const;
export const initSystemSchema = z.enum(INIT_SYSTEMS);
export type InitSystem = z.infer<typeof initSystemSchema>;

export const INIT_LABEL: Record<InitSystem, string> = {
  systemd: "systemd",
  openrc: "OpenRC",
  runit: "runit",
  sysvinit: "SysVinit",
  s6: "s6",
  dinit: "dinit",
  busybox: "BusyBox init",
};

/** Where a fact came from: our hand-checked data, or a source filling a blank. */
export const factSourceSchema = z.enum(["curated", "wikidata"]);
export type FactSource = z.infer<typeof factSourceSchema>;

export const distroFactsSchema = z.object({
  /** What the main download ships with; null when there is none or we don't know. */
  defaultDesktop: desktopSchema.nullable(),
  /** Other desktops the project itself offers (editions, spins, installer choices). */
  otherDesktops: z.array(desktopSchema),
  /** Official flavours that are their own distro on this site, by desktop: e.g. Ubuntu's KDE edition is Kubuntu. */
  editions: z.array(z.object({ desktop: desktopSchema, slug: z.string() })),
  packageManager: packageManagerSchema.nullable(),
  init: initSystemSchema.nullable(),
  /** The project page that backs the desktop facts. */
  sourceUrl: z.string().nullable(),
  /** Per field, where the value came from. */
  fieldSources: z.record(z.string(), factSourceSchema),
});
export type DistroFacts = z.infer<typeof distroFactsSchema>;
