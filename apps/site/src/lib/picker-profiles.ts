/**
 * Curated picker profiles, keyed by DistroWatch key. Tags describe how a
 * distro is generally used and maintained (reviewed 2026-11-03). Keep claims
 * conservative; the quiz explains each match, so every tag must be defensible.
 */
export type Level = "new" | "some" | "expert";
export type Use = "everyday" | "gaming" | "dev" | "old-hw" | "privacy";
export type Updates = "stable" | "rolling";
export type Desktop = "windows-like" | "mac-like" | "gnome" | "kde" | "light";

export interface PickerProfile {
  key: string;
  levels: Level[];
  uses: Use[];
  updates: Updates;
  desktops: Desktop[];
  /** One plain sentence shown with the suggestion. */
  blurb: string;
}

export const PROFILES: PickerProfile[] = [
  { key: "mint", levels: ["new", "some"], uses: ["everyday", "old-hw"], updates: "stable", desktops: ["windows-like", "light"], blurb: "Familiar Windows-style desktop (Cinnamon), Ubuntu LTS base, very little setup." },
  { key: "zorin", levels: ["new"], uses: ["everyday"], updates: "stable", desktops: ["windows-like", "mac-like"], blurb: "Polished desktop with Windows- and macOS-style layouts; aimed at people leaving Windows." },
  { key: "ubuntu", levels: ["new", "some"], uses: ["everyday", "dev"], updates: "stable", desktops: ["gnome"], blurb: "The most widely documented desktop Linux; long-term support releases." },
  { key: "popos", levels: ["new", "some"], uses: ["everyday", "gaming", "dev"], updates: "stable", desktops: ["gnome"], blurb: "System76's Ubuntu-based distro with an NVIDIA ISO and a tiling-friendly desktop." },
  { key: "fedora", levels: ["some", "expert"], uses: ["everyday", "dev"], updates: "stable", desktops: ["gnome", "kde"], blurb: "Up-to-date software on a fixed release cycle; a common choice for developers." },
  { key: "debian", levels: ["some", "expert"], uses: ["everyday", "dev", "old-hw"], updates: "stable", desktops: ["gnome", "kde", "light"], blurb: "Very stable base that many other distros build on; you choose the desktop." },
  { key: "mx", levels: ["new", "some"], uses: ["everyday", "old-hw"], updates: "stable", desktops: ["light", "kde"], blurb: "Debian-based with handy graphical tools; light enough for older machines." },
  { key: "cachyos", levels: ["some", "expert"], uses: ["gaming", "everyday"], updates: "rolling", desktops: ["kde", "gnome"], blurb: "Arch-based and tuned for speed, with gaming-friendly defaults and a graphical installer." },
  { key: "bazzite", levels: ["new", "some"], uses: ["gaming"], updates: "stable", desktops: ["kde", "gnome"], blurb: "Fedora-based gaming distro with Steam set up; image-based updates you can roll back." },
  { key: "nobara", levels: ["some"], uses: ["gaming"], updates: "stable", desktops: ["kde"], blurb: "Fedora with gaming and media fixes already applied." },
  { key: "endeavour", levels: ["some", "expert"], uses: ["everyday", "dev"], updates: "rolling", desktops: ["kde", "gnome", "light"], blurb: "Arch with a friendly installer and a close-to-Arch setup." },
  { key: "manjaro", levels: ["some"], uses: ["everyday", "gaming"], updates: "rolling", desktops: ["kde", "gnome", "light"], blurb: "Arch-based with tested, delayed updates and graphical tools." },
  { key: "arch", levels: ["expert"], uses: ["dev", "everyday"], updates: "rolling", desktops: ["kde", "gnome", "light"], blurb: "Build your own system from a minimal base; excellent wiki." },
  { key: "elementary", levels: ["new"], uses: ["everyday"], updates: "stable", desktops: ["mac-like"], blurb: "Clean, macOS-like desktop with a curated app store." },
  { key: "opensuse", levels: ["some", "expert"], uses: ["everyday", "dev"], updates: "stable", desktops: ["kde", "gnome"], blurb: "Leap (fixed release) or Tumbleweed (tested rolling), with the YaST admin tools." },
  { key: "kdeneon", levels: ["some"], uses: ["everyday"], updates: "stable", desktops: ["kde"], blurb: "The newest KDE Plasma on an Ubuntu LTS base." },
  { key: "kubuntu", levels: ["new", "some"], uses: ["everyday"], updates: "stable", desktops: ["kde", "windows-like"], blurb: "Ubuntu with the KDE Plasma desktop." },
  { key: "lubuntu", levels: ["new", "some"], uses: ["old-hw", "everyday"], updates: "stable", desktops: ["light"], blurb: "Lightweight Ubuntu flavour for older computers." },
  { key: "xubuntu", levels: ["new", "some"], uses: ["old-hw", "everyday"], updates: "stable", desktops: ["light"], blurb: "Ubuntu with the light, traditional Xfce desktop." },
  { key: "antix", levels: ["some", "expert"], uses: ["old-hw"], updates: "stable", desktops: ["light"], blurb: "Very light Debian-based system that runs on old hardware." },
  { key: "q4os", levels: ["new", "some"], uses: ["old-hw", "everyday"], updates: "stable", desktops: ["windows-like", "light"], blurb: "Debian-based with a classic, Windows-style desktop that stays light." },
  { key: "nixos", levels: ["expert"], uses: ["dev"], updates: "rolling", desktops: ["kde", "gnome", "light"], blurb: "The whole system is defined in one config file; reproducible and easy to roll back." },
  { key: "void", levels: ["expert"], uses: ["dev", "old-hw"], updates: "rolling", desktops: ["light"], blurb: "Independent, minimal rolling distro with its own package manager and init." },
  { key: "garuda", levels: ["some"], uses: ["gaming"], updates: "rolling", desktops: ["kde"], blurb: "Arch-based, eye-catching KDE setup with gaming tools included." },
  { key: "tails", levels: ["some", "expert"], uses: ["privacy"], updates: "stable", desktops: ["gnome"], blurb: "Runs from a USB stick, sends traffic through Tor and forgets everything on shutdown." },
  { key: "qubes", levels: ["expert"], uses: ["privacy"], updates: "stable", desktops: ["light"], blurb: "Security by isolation: apps run in separate virtual machines." },
  { key: "kali", levels: ["expert"], uses: ["privacy", "dev"], updates: "rolling", desktops: ["light"], blurb: "Security testing toolkit; not meant as an everyday desktop." },
  { key: "alpine", levels: ["expert"], uses: ["dev"], updates: "stable", desktops: ["light"], blurb: "Tiny and security-minded; best known for containers and servers." },
  { key: "solus", levels: ["some"], uses: ["everyday"], updates: "rolling", desktops: ["gnome", "kde"], blurb: "Independent, curated rolling distro focused on the desktop." },
  { key: "aurora", levels: ["new", "some"], uses: ["dev", "everyday"], updates: "stable", desktops: ["kde"], blurb: "Image-based Fedora with KDE and developer tools; updates roll back if something breaks." },
];
