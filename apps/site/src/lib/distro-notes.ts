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
  // Added 2026-11-06 with the picker v2 profiles; pending maintainer review.
  {
    key: "bluefin",
    pros: ["Image-based Fedora with GNOME and developer tools", "Updates roll back if something breaks", "NVIDIA images with drivers included"],
    cons: ["Different way of installing system software", "Apps mostly via Flatpak or Homebrew", "Smaller community than Fedora itself"],
  },
  {
    key: "ultramarine",
    pros: ["Fedora with codecs and extra repositories ready", "Several desktop editions", "Close to Fedora, so most Fedora guides apply"],
    cons: ["Small team", "Short Fedora support window per release", "Less documentation of its own"],
  },
  {
    key: "pikaos",
    pros: ["Gaming tweaks and newer kernels out of the box", "Debian package base", "Graphical tools for drivers"],
    cons: ["Small team", "Built on Debian's moving packages, so updates change more often", "Less documentation than big distros"],
  },
  {
    key: "anduin",
    pros: ["Windows 11-style layout on GNOME", "Ubuntu base, so Ubuntu guides apply", "Simple setup for people leaving Windows"],
    cons: ["Young project with a small team", "Fewer desktop choices", "Relies on GNOME extensions for its layout"],
  },
  {
    key: "omarchy",
    pros: ["Fully set-up Hyprland tiling desktop", "Keyboard-first workflow", "Arch base with current software"],
    cons: ["Opinionated defaults you may need to undo", "Keyboard-driven, steep for mouse users", "Young project"],
  },
  {
    key: "artix",
    pros: ["Arch without systemd", "Choice of init systems", "Access to Arch-style rolling packages"],
    cons: ["Some software assumes systemd", "Smaller community than Arch", "Manual setup expected"],
  },
  {
    key: "tuxedo",
    pros: ["KDE Plasma on an Ubuntu base", "Driver and power tools from a Linux laptop maker", "Works on other PCs too"],
    cons: ["Best tested on TUXEDO hardware", "Smaller community", "Release timing set by one company"],
  },
  {
    key: "puppy",
    pros: ["Runs in RAM from a USB stick", "Works on very old computers", "Saves your session to the stick"],
    cons: ["Unusual way of doing things", "Several variants to choose between", "Not meant as a modern everyday desktop"],
  },
  {
    key: "pclinuxos",
    pros: ["Rolling updates with a classic desktop", "No systemd", "Long-running, independent project"],
    cons: ["Small team", "64-bit only, fewer packages than big distros", "Less modern tooling"],
  },
  {
    key: "sparky",
    pros: ["Light Debian base", "Stable and rolling editions", "Many desktop choices"],
    cons: ["Small team", "Less polish than Mint or Ubuntu", "Documentation is thinner"],
  },
  {
    key: "mageia",
    pros: ["Friendly graphical control center", "Community-run and independent", "Several desktop choices"],
    cons: ["Slow release cadence", "Smaller community", "Fewer third-party packages"],
  },
  {
    key: "devuan",
    pros: ["Debian without systemd", "Choice of init systems", "Stable Debian-style releases"],
    cons: ["Some software assumes systemd", "Releases follow Debian's with a delay", "Smaller community"],
  },
  {
    key: "lite",
    pros: ["Simple Windows-style layout", "Light on resources", "Ubuntu LTS base with long support"],
    cons: ["Desktop looks dated next to newer ones", "Small team", "Fewer desktop choices"],
  },
  {
    key: "parrot",
    pros: ["Security tools ready to use", "Home edition for private everyday use", "Debian base"],
    cons: ["Security edition is not an everyday desktop", "Tools are only legal on systems you're allowed to test", "Smaller community than Kali"],
  },
  {
    key: "alma",
    pros: ["Free rebuild of Red Hat Enterprise Linux", "Around ten years of support per major version", "Backed by a non-profit foundation"],
    cons: ["Older software by design", "Desktop is secondary", "Some desktop apps need extra repositories"],
  },
  {
    key: "rocky",
    pros: ["Free rebuild of Red Hat Enterprise Linux", "Around ten years of support per major version", "Large enterprise community"],
    cons: ["Older software by design", "Desktop is secondary", "Some desktop apps need extra repositories"],
  },
  {
    key: "gentoo",
    pros: ["Build software with exactly the options you want", "Excellent documentation", "Choice of init systems"],
    cons: ["Compiling takes a long time", "Installation is manual", "Needs ongoing attention"],
  },
  {
    key: "slackware",
    pros: ["Simple, traditional design", "Very stable", "Teaches how Linux works"],
    cons: ["Manual dependency handling", "Infrequent releases", "Not aimed at beginners"],
  },
  {
    key: "peppermint",
    pros: ["Light Xfce desktop", "Debian base", "Simple, uncluttered setup"],
    cons: ["Few apps installed by default", "Small team", "Less hand-holding than Mint"],
  },
  {
    key: "deepin",
    pros: ["Polished DDE desktop with a dock", "Own set of good-looking apps", "Easy installer"],
    cons: ["Desktop can feel heavy", "Development is centred in China, and docs are often Chinese-first", "Smaller English-speaking community"],
  },
  {
    key: "vanilla",
    pros: ["Image-based Debian that rolls back", "Run apps from other distros in containers", "Clean GNOME desktop"],
    cons: ["Different way of installing software", "Young project", "Fewer guides than Debian or Ubuntu"],
  },
  {
    key: "nitrux",
    pros: ["Immutable system that rolls back", "Distinctive Plasma-based desktop", "AppImage-first apps"],
    cons: ["Unusual setup that differs from most guides", "No systemd may surprise some software", "Small team"],
  },
  {
    key: "raspios",
    pros: ["Official system for Raspberry Pi", "Best hardware support on Pi boards", "Huge number of Pi guides"],
    cons: ["Only for Raspberry Pi", "Older Debian packages", "Light desktop with few frills"],
  },
  {
    key: "dietpi",
    pros: ["Very small footprint", "Menu installs common self-hosted apps", "Runs on many boards and PCs"],
    cons: ["Mostly for servers, not desktops", "Text-menu driven", "Fewer graphical tools"],
  },
  {
    key: "armbian",
    pros: ["Supports hundreds of ARM boards", "Debian or Ubuntu base", "Good for servers and home labs"],
    cons: ["Support varies by board", "Desktop is secondary", "Some boards only get community builds"],
  },
  {
    key: "ubuntustudio",
    pros: ["Audio, video and graphics tools installed", "Tuned for low-latency audio", "Ubuntu base with long support"],
    cons: ["Large install with many apps", "Needs a fairly capable computer", "Only KDE Plasma"],
  },
  {
    key: "avlinux",
    pros: ["Set up for low-latency audio", "Music and video tools included", "Debian base"],
    cons: ["Small team", "Niche focus", "Fewer desktop choices"],
  },
  {
    key: "tinycore",
    pros: ["Extremely small", "Runs in RAM on very old hardware", "You choose exactly what to add"],
    cons: ["Very bare out of the box", "Unusual package system", "Not for beginners"],
  },
  {
    key: "trisquel",
    pros: ["Only free software", "Endorsed by the Free Software Foundation", "Ubuntu base"],
    cons: ["Some Wi-Fi and graphics hardware won't work", "No proprietary codecs or drivers", "Releases lag behind Ubuntu"],
  },
  {
    key: "pureos",
    pros: ["Only free software", "Privacy-minded defaults", "Also used on Purism phones and laptops"],
    cons: ["Some hardware won't work without non-free firmware", "Older Debian base", "Small community"],
  },
  {
    key: "endless",
    pros: ["Comes loaded with apps and offline content", "Image-based updates that roll back", "Made for new users and schools"],
    cons: ["Large download", "System software is hard to change", "Fewer desktop choices"],
  },
  {
    key: "ubuntumate",
    pros: ["Traditional MATE desktop", "Switchable layouts, including Windows-style", "Ubuntu LTS base"],
    cons: ["Desktop has fewer modern features", "Some Ubuntu tools assume GNOME", "Smaller community than Mint"],
  },
  {
    key: "ubuntubudgie",
    pros: ["Clean Budgie desktop with switchable layouts", "Ubuntu base with long support", "Good-looking defaults"],
    cons: ["Budgie is less widely used", "Fewer guides than Ubuntu", "Some layouts need tweaking"],
  },
];

const BY_KEY = new Map(NOTES.map((n) => [n.key, n]));

export function notesFor(key: string): DistroNotes | null {
  return BY_KEY.get(key) ?? null;
}
