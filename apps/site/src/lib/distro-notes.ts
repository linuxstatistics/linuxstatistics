/**
 * Curated pros and cons, keyed by DistroWatch key (same keys as
 * picker-profiles.ts). Draft 2026-11-05, pending maintainer review.
 * Rules: short, plain, checkable against the project's own docs; a con must be
 * a fair trade-off, never an insult; no version numbers that go stale.
 */
export interface DistroNotes {
  key: string;
  pros: string[];
  cons: string[];
}

export const NOTES: DistroNotes[] = [
  {
    key: "mint",
    pros: ["Windows-style Cinnamon desktop that feels familiar", "Media codecs and drivers offered at install", "Built on Ubuntu LTS, so most Ubuntu guides apply"],
    cons: ["Newest apps and kernels arrive later than on Fedora or Arch", "Wayland support is behind GNOME and KDE", "No official ARM builds"],
  },
  {
    key: "zorin",
    pros: ["Layouts that mimic Windows or macOS", "Polished, beginner-focused setup", "Ubuntu LTS base with long support"],
    cons: ["Some layouts and extras need the paid Pro edition", "New major versions arrive well after Ubuntu's", "Smaller community than Ubuntu or Mint"],
  },
  {
    key: "ubuntu",
    pros: ["The most documented desktop Linux", "LTS releases supported for years", "Widely supported by commercial software and hardware vendors"],
    cons: ["Snap packages are the default for some apps, which some users dislike", "Stock GNOME is customised in ways that differ from upstream", "LTS software ages between releases"],
  },
  {
    key: "popos",
    pros: ["NVIDIA ISO with drivers ready", "COSMIC desktop with built-in tiling", "Made by a hardware vendor (System76) that tests it on laptops"],
    cons: ["Release timing follows System76, not Ubuntu's calendar", "COSMIC is newer and less mature than GNOME or KDE", "Fewer desktop choices than Ubuntu flavours"],
  },
  {
    key: "fedora",
    pros: ["Recent software on a predictable six-month cycle", "Close to upstream GNOME and KDE", "Early adopter of new Linux tech (Wayland, PipeWire, Btrfs)"],
    cons: ["Each release is supported for only about 13 months", "Patented media codecs need extra setup", "Version upgrades twice a year"],
  },
  {
    key: "debian",
    pros: ["Very stable and thoroughly tested", "Huge package archive", "Community-run with no company in control"],
    cons: ["Stable releases ship older software", "Less hand-holding at install than Ubuntu or Mint", "Non-free firmware and drivers may need extra steps on some hardware"],
  },
  {
    key: "mx",
    pros: ["Handy graphical MX Tools for common tasks", "Light enough for older computers", "Debian stable base"],
    cons: ["Xfce default looks dated to some", "Older software than rolling distros", "Smaller community than Mint or Ubuntu"],
  },
  {
    key: "cachyos",
    pros: ["Performance-tuned kernels and packages", "Gaming-friendly defaults", "Graphical installer with many desktop choices"],
    cons: ["Rolling updates need regular attention", "Optimised packages need newer CPUs for the fastest builds", "Young project with a smaller team"],
  },
  {
    key: "bazzite",
    pros: ["Steam and gaming tools ready out of the box", "Image-based updates you can roll back", "Steam Deck-style mode available"],
    cons: ["System changes work differently than on traditional distros", "Installing system packages is discouraged; apps come as Flatpaks", "Focused on gaming more than general use"],
  },
  {
    key: "nobara",
    pros: ["Fedora with gaming and media fixes applied", "Codecs and drivers handled for you", "KDE desktop set up for gaming"],
    cons: ["Maintained by a small team", "Updates can lag behind Fedora", "Less tested than Fedora itself"],
  },
  {
    key: "endeavour",
    pros: ["Close to plain Arch, with an easy installer", "Access to the AUR", "Friendly community forum"],
    cons: ["Rolling updates need regular attention", "Few graphical admin tools", "Expects you to use the terminal"],
  },
  {
    key: "manjaro",
    pros: ["Arch-based with graphical tools", "Holds updates back for testing", "Several desktops to choose from"],
    cons: ["Delayed updates can clash with AUR packages built for current Arch", "Has had certificate and infrastructure mishaps", "Not supported by the Arch community"],
  },
  {
    key: "arch",
    pros: ["Excellent wiki that helps users of every distro", "Always-current software", "You install only what you choose"],
    cons: ["Manual install (archinstall helps)", "Updates occasionally need manual steps", "Not aimed at beginners"],
  },
  {
    key: "elementary",
    pros: ["Clean, consistent macOS-like desktop", "Curated app store with pay-what-you-want apps", "Strong focus on design"],
    cons: ["Fewer customisation options", "Releases follow Ubuntu LTS slowly", "Smaller app selection in its own store"],
  },
  {
    key: "opensuse",
    pros: ["Choice of Leap (fixed) or Tumbleweed (tested rolling)", "YaST and other strong admin tools", "Btrfs snapshots for easy rollback"],
    cons: ["Media codecs need extra setup", "Smaller English-speaking community than Ubuntu", "Two editions can confuse newcomers"],
  },
  {
    key: "kdeneon",
    pros: ["Newest KDE Plasma as soon as it's released", "Ubuntu LTS base underneath", "Made by KDE developers"],
    cons: ["Aimed at KDE enthusiasts more than general users", "Mix of new KDE and older Ubuntu packages", "Fewer extras out of the box"],
  },
  {
    key: "kubuntu",
    pros: ["Ubuntu with the KDE Plasma desktop", "Windows-like layout by default", "Ubuntu's documentation and support"],
    cons: ["Plasma versions lag behind KDE's releases", "Snap defaults as in Ubuntu", "Smaller team than main Ubuntu"],
  },
  {
    key: "lubuntu",
    pros: ["Light LXQt desktop for older computers", "Ubuntu base and documentation", "Low memory use"],
    cons: ["Fewer built-in tools than heavier desktops", "LXQt looks basic to some", "Still needs a 64-bit CPU"],
  },
  {
    key: "xubuntu",
    pros: ["Light, traditional Xfce desktop", "Ubuntu base and documentation", "Stable and predictable"],
    cons: ["Xfce develops slowly", "Looks dated to some", "Wayland support is limited"],
  },
  {
    key: "antix",
    pros: ["Runs on very old or low-memory hardware", "No systemd by default", "Excellent live USB features"],
    cons: ["Window managers instead of a full desktop", "Many tasks need the terminal or custom tools", "Not aimed at beginners"],
  },
  {
    key: "q4os",
    pros: ["Classic Windows-style desktop (Trinity)", "Light on resources", "Debian stable base"],
    cons: ["Trinity is an older desktop with a small team", "Small community", "Older software"],
  },
  {
    key: "nixos",
    pros: ["Whole system defined in one config file", "Easy rollback to earlier setups", "Largest package collection (nixpkgs)"],
    cons: ["Steep learning curve with its own language", "Doesn't follow usual Linux file layouts", "Some software needs extra work to run"],
  },
  {
    key: "void",
    pros: ["Independent with its own fast package manager", "runit init instead of systemd", "Glibc and musl editions"],
    cons: ["Smaller package collection", "Few graphical tools", "Not aimed at beginners"],
  },
  {
    key: "garuda",
    pros: ["Striking KDE setup with gaming tools", "Btrfs snapshots set up for rollback", "Arch base with the AUR"],
    cons: ["Heavy defaults need a fairly modern PC", "Rolling updates need attention", "Busy look isn't for everyone"],
  },
  {
    key: "tails",
    pros: ["Routes all traffic through Tor", "Forgets everything on shutdown", "Runs from a USB stick on almost any PC"],
    cons: ["Not meant for everyday use", "Slower browsing through Tor", "Optional persistent storage must be set up"],
  },
  {
    key: "qubes",
    pros: ["Strong isolation: apps run in separate virtual machines", "Compromise of one app is contained", "Trusted by security professionals"],
    cons: ["Needs powerful hardware and lots of RAM", "Limited hardware compatibility", "Steep learning curve"],
  },
  {
    key: "kali",
    pros: ["Hundreds of security testing tools included", "Well documented for penetration testing", "Many platforms including ARM"],
    cons: ["Not meant as an everyday desktop", "Rolling base with frequent changes", "Easy to misuse without security knowledge"],
  },
  {
    key: "alpine",
    pros: ["Tiny and fast", "Security-minded defaults", "Standard base for containers"],
    cons: ["musl libc breaks some prebuilt software", "Minimal desktop experience", "Uses OpenRC, not systemd"],
  },
  {
    key: "solus",
    pros: ["Independent and desktop-focused", "Curated rolling updates, released weekly", "Budgie desktop made by the project"],
    cons: ["Smaller package collection", "Has gone through leadership changes", "Small team"],
  },
  {
    key: "aurora",
    pros: ["Image-based Fedora with KDE and developer tools", "Updates roll back if something breaks", "Containers and dev tools set up"],
    cons: ["Different way of installing system software", "Young project", "Apps mostly via Flatpak"],
  },
];

const BY_KEY = new Map(NOTES.map((n) => [n.key, n]));

export function notesFor(key: string): DistroNotes | null {
  return BY_KEY.get(key) ?? null;
}
