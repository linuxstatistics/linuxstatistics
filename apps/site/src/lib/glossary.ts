/**
 * Plain-language Linux terms for /glossary/. Each definition is written for
 * someone new to Linux: the first sentence answers "what is it" on its own
 * (it becomes the page description and the DefinedTerm text); `more` adds
 * why it matters when choosing a distro. `related` uses other term slugs;
 * `see` links to pages on this site.
 */
export type GlossaryGroup = "basics" | "updates" | "software" | "desktop" | "system" | "install";

export interface GlossaryTerm {
  slug: string;
  term: string;
  /** Other names people search for. */
  aka?: string[];
  /** Product or project name: links in running text only with this exact capitalization ("Snap", not "snap"). */
  proper?: boolean;
  group: GlossaryGroup;
  short: string;
  more?: string;
  related?: string[];
  see?: { label: string; href: string }[];
}

export const GLOSSARY_GROUPS: { id: GlossaryGroup; label: string }[] = [
  { id: "basics", label: "Basics" },
  { id: "updates", label: "Releases and updates" },
  { id: "software", label: "Installing software" },
  { id: "desktop", label: "Desktops and graphics" },
  { id: "system", label: "Under the hood" },
  { id: "install", label: "Downloading and installing" },
];

export const GLOSSARY: GlossaryTerm[] = [
  // Basics
  { slug: "linux", term: "Linux", group: "basics", short: "Linux is the kernel at the heart of many operating systems: the part that talks to the hardware and runs programs.", more: "People usually say \"Linux\" for a whole operating system built around that kernel, which is what a distro is.", related: ["kernel", "distro"] },
  { slug: "distro", term: "Distro", aka: ["distribution", "Linux distribution"], group: "basics", short: "A distro is a complete operating system built on the Linux kernel, with a desktop, apps, an installer and a way to update.", more: "Distros differ in how often they update, which desktop they ship and who they're made for. Ubuntu, Fedora and Linux Mint are distros.", related: ["linux", "base-distro", "desktop-environment"], see: [{ label: "All distros ranked", href: "/" }, { label: "Which distro? Take the quiz", href: "/pick/" }] },
  { slug: "base-distro", term: "Base distro", aka: ["upstream", "based on", "derivative"], group: "basics", short: "A base distro is the one another distro is built from, reusing its packages and updates.", more: "Linux Mint is based on Ubuntu, which is based on Debian. Help written for the base usually works for the distros built on it.", related: ["distro", "package-manager"] },
  { slug: "kernel", term: "Kernel", group: "basics", short: "The kernel is the core of the operating system that manages memory, the processor and devices.", more: "Newer kernels support newer hardware, which matters most for recent laptops and graphics cards.", related: ["linux", "driver"] },
  { slug: "open-source", term: "Open source", aka: ["free software", "FOSS"], group: "basics", short: "Open-source software publishes its source code under a license that lets anyone read, change and share it.", more: "Some distros ship only free software and leave out proprietary drivers and codecs; most include or offer them.", related: ["proprietary-driver", "codec"] },
  { slug: "terminal", term: "Terminal", aka: ["command line", "shell", "console"], group: "basics", short: "The terminal is a text window where you type commands instead of clicking.", more: "Beginner-friendly distros let you do almost everything without it, but help online often gives terminal commands because they're easy to copy.", related: ["sudo"] },
  { slug: "sudo", proper: true, term: "sudo", group: "basics", short: "sudo runs a single command with administrator rights after asking for your password.", more: "It's how Linux asks for permission before changing the system, much like the Windows admin prompt.", related: ["terminal"] },

  // Releases and updates
  { slug: "fixed-release", term: "Fixed release", aka: ["point release", "stable release"], group: "updates", short: "A fixed-release distro ships a new version on a schedule and between versions gives mostly security and bug fixes.", more: "Things change little from day to day, which is why most beginner distros work this way.", related: ["rolling-release", "lts", "end-of-life"], see: [{ label: "Support dates", href: "/support-dates/" }] },
  { slug: "rolling-release", term: "Rolling release", group: "updates", short: "A rolling-release distro has no big version upgrades: new software arrives continuously as soon as it's ready.", more: "You get the newest apps and drivers sooner, with a higher chance that an update needs attention. Arch Linux and openSUSE Tumbleweed are rolling.", related: ["fixed-release", "rollback"] },
  { slug: "lts", proper: true, term: "LTS", aka: ["long-term support"], group: "updates", short: "LTS means long-term support: a release that gets security updates for years, often five or more.", more: "Good for computers you want to set up once and leave alone, like a family PC or a server.", related: ["fixed-release", "end-of-life"], see: [{ label: "Support dates", href: "/support-dates/" }] },
  { slug: "end-of-life", term: "End of life", aka: ["EOL", "end of support"], group: "updates", short: "End of life is the date a release stops getting security updates, so it should be upgraded or replaced.", more: "After that you should upgrade to a newer release. Our support-dates page lists the date for each tracked release.", related: ["lts", "fixed-release"], see: [{ label: "Support dates", href: "/support-dates/" }] },
  { slug: "immutable", term: "Immutable distro", aka: ["atomic", "image-based"], group: "updates", short: "An immutable (or atomic) distro installs the core system as one read-only image and updates it as a whole.", more: "If an update breaks something you can boot the previous image. Apps usually come as Flatpaks. Fedora Silverblue, Bazzite and Aurora work this way.", related: ["rollback", "flatpak", "snapshot"] },
  { slug: "rollback", term: "Rollback", group: "updates", short: "A rollback returns the system to how it was before an update, usually by choosing the previous version when the computer starts.", more: "Immutable distros and NixOS have it built in; others can get it with snapshots.", related: ["immutable", "snapshot"] },
  { slug: "snapshot", term: "Snapshot", aka: ["Timeshift", "Snapper"], group: "updates", short: "A snapshot is a saved copy of the system at one moment that you can go back to later.", more: "Tools like Timeshift (Linux Mint) and Snapper (openSUSE) take one before updates. Snapshots protect the system, not a replacement for backing up your files.", related: ["rollback", "btrfs"] },

  // Installing software
  { slug: "package", term: "Package", group: "software", short: "A package is an app or library bundled with the information needed to install, update and remove it.", related: ["package-manager", "repository"] },
  { slug: "package-manager", term: "Package manager", aka: ["apt", "dnf", "pacman", "zypper"], group: "software", short: "A package manager installs, updates and removes software and everything it depends on.", more: "Debian and Ubuntu use apt, Fedora uses dnf, Arch uses pacman and openSUSE uses zypper. App stores like GNOME Software sit on top of them.", related: ["package", "repository", "software-center"] },
  { slug: "repository", term: "Repository", aka: ["repo"], group: "software", short: "A repository is a server, run by the distro or someone else, that your package manager downloads software from.", more: "Software from the distro's own repositories is checked and updated with the system; third-party ones are only as trustworthy as whoever runs them.", related: ["package-manager", "ppa", "aur"] },
  { slug: "software-center", term: "Software center", aka: ["app store", "GNOME Software", "Discover"], group: "software", short: "A software center is a graphical app store for finding and installing apps without the terminal.", related: ["package-manager", "flatpak"] },
  { slug: "flatpak", proper: true, term: "Flatpak", aka: ["Flathub"], group: "software", short: "Flatpak is a way to install apps that works the same on almost every distro, with apps kept in their own sandbox.", more: "Most apps come from Flathub. Flatpaks are the main way to add apps on immutable distros.", related: ["snap", "appimage", "immutable"] },
  { slug: "snap", proper: true, term: "Snap", group: "software", short: "Snap is Canonical's app format, used by default on Ubuntu, that bundles an app with what it needs and updates it automatically.", related: ["flatpak", "appimage"] },
  { slug: "appimage", proper: true, term: "AppImage", group: "software", short: "An AppImage is a single file that contains a whole app: download it, make it executable and run it.", more: "Nothing is installed system-wide, and updates are up to the app.", related: ["flatpak", "snap"] },
  { slug: "ppa", proper: true, term: "PPA", aka: ["Personal Package Archive"], group: "software", short: "A PPA is an extra repository for Ubuntu and its derivatives, usually run by one developer or team.", more: "Handy for newer versions of an app, but PPAs can break upgrades; add them only from sources you trust.", related: ["repository"] },
  { slug: "aur", proper: true, term: "AUR", aka: ["Arch User Repository"], group: "software", short: "The AUR is a large, community-run collection of build scripts for Arch-based distros.", more: "It covers almost any app, but nothing in it is checked by Arch; read what you install.", related: ["repository", "package-manager"] },
  { slug: "proton", proper: true, term: "Proton", aka: ["Steam Play"], group: "software", short: "Proton is Valve's compatibility layer that lets Steam run Windows games on Linux.", more: "Many games work out of the box. Check a game on ProtonDB first; games with kernel-level anti-cheat often don't run.", related: ["wine"], see: [{ label: "Best Linux for gaming", href: "/best/gaming/" }] },
  { slug: "wine", proper: true, term: "Wine", group: "software", short: "Wine runs many Windows programs on Linux by translating Windows system calls, without a copy of Windows.", related: ["proton"] },
  { slug: "codec", term: "Codec", aka: ["multimedia codecs"], group: "software", short: "A codec is software that plays or records a particular audio or video format, such as H.264 video.", more: "Some formats are patented, so a few distros don't install every codec by default and ask you to add them.", related: ["open-source"] },

  // Desktops and graphics
  { slug: "desktop-environment", term: "Desktop environment", aka: ["DE"], group: "desktop", short: "A desktop environment is everything you see and click: the panel, menus, windows, settings and basic apps.", more: "GNOME, KDE Plasma, Cinnamon, Xfce and COSMIC are desktop environments. Many distros offer more than one.", related: ["gnome", "kde-plasma", "cinnamon", "xfce", "window-manager"], see: [{ label: "Linux desktops compared", href: "/desktop/" }] },
  { slug: "gnome", proper: true, term: "GNOME", group: "desktop", short: "GNOME is a desktop with a top bar and a full-screen overview for opening apps and switching windows.", more: "It's the default on Ubuntu and Fedora. It looks clean and simple, and it changes with extensions rather than lots of settings.", related: ["desktop-environment", "kde-plasma"], see: [{ label: "GNOME explained", href: "/desktop/gnome/" }] },
  { slug: "kde-plasma", proper: true, term: "KDE Plasma", aka: ["KDE"], group: "desktop", short: "KDE Plasma is a desktop with a bottom taskbar and start menu by default and a great many settings.", more: "Its layout feels familiar coming from Windows. Kubuntu, Fedora KDE, Bazzite and the Steam Deck's desktop mode use it.", related: ["desktop-environment", "gnome"], see: [{ label: "KDE Plasma explained", href: "/desktop/kde-plasma/" }] },
  { slug: "cinnamon", proper: true, term: "Cinnamon", group: "desktop", short: "Cinnamon is Linux Mint's desktop: a traditional layout with a taskbar, start menu and system tray.", related: ["desktop-environment", "kde-plasma"], see: [{ label: "Cinnamon explained", href: "/desktop/cinnamon/" }] },
  { slug: "xfce", proper: true, term: "Xfce", group: "desktop", short: "Xfce is a lightweight, traditional desktop that stays quick on older computers.", related: ["desktop-environment"], see: [{ label: "Xfce explained", href: "/desktop/xfce/" }, { label: "Best Linux for old laptops", href: "/best/old-laptop/" }] },
  { slug: "cosmic", proper: true, term: "COSMIC", group: "desktop", short: "COSMIC is System76's desktop, written in Rust, with a top panel, a dock and window tiling built in.", more: "It's the default on Pop!_OS 24.04 and is packaged for several other distros.", related: ["desktop-environment", "tiling"], see: [{ label: "COSMIC explained", href: "/desktop/cosmic/" }] },
  { slug: "window-manager", term: "Window manager", aka: ["WM", "tiling window manager"], group: "desktop", short: "A window manager only places and draws windows; unlike a full desktop it comes with few or no settings apps or panels.", more: "Tiling window managers such as Hyprland, Sway and i3 arrange windows side by side and are run mostly from the keyboard.", related: ["desktop-environment", "tiling"], see: [{ label: "Tiling window managers", href: "/desktop/window-managers/" }] },
  { slug: "tiling", term: "Tiling", group: "desktop", short: "Tiling arranges open windows side by side so they fill the screen without overlapping.", related: ["window-manager", "cosmic"] },
  { slug: "wayland", proper: true, term: "Wayland", aka: ["X11", "Xorg"], group: "desktop", short: "Wayland is the modern system that draws windows on screen, replacing the older X11 (Xorg).", more: "Most current desktops use Wayland by default. A few older apps and tools still need X11, which can run inside Wayland.", related: ["desktop-environment"] },
  { slug: "driver", term: "Driver", group: "desktop", short: "A driver is software that lets the operating system use a piece of hardware, such as a graphics card or Wi-Fi chip.", more: "Most drivers come with the kernel. NVIDIA graphics and some Wi-Fi chips need extra drivers that some distros install for you.", related: ["proprietary-driver", "kernel"] },
  { slug: "proprietary-driver", term: "Proprietary driver", aka: ["NVIDIA driver", "non-free"], group: "desktop", short: "A proprietary driver is closed-source, made by the hardware maker rather than the community.", more: "NVIDIA's driver is the best-known one. Distros like Pop!_OS and Bazzite install it for you; others add it from a settings app.", related: ["driver", "open-source"], see: [{ label: "Best Linux for NVIDIA cards", href: "/best/nvidia/" }] },

  // Under the hood
  { slug: "init-system", term: "Init system", aka: ["systemd", "OpenRC", "runit"], group: "system", short: "The init system is the first program the kernel starts; it starts and supervises everything else.", more: "Most distros use systemd. A few, such as Devuan, Artix and Void, use simpler alternatives.", related: ["kernel"] },
  { slug: "btrfs", proper: true, term: "Btrfs", aka: ["ext4", "file system"], group: "system", short: "Btrfs is a Linux file system that can take instant snapshots and compress data.", more: "Fedora and openSUSE use it by default; many other distros use ext4, which is simpler and very mature.", related: ["snapshot"] },
  { slug: "telemetry", term: "Telemetry", group: "system", short: "Telemetry is data a system sends home about how it's used: anything from an anonymous install count to hardware and usage details.", more: "We check what each distro sends by default and how to turn it off.", related: ["open-source"], see: [{ label: "Telemetry by distro", href: "/telemetry/" }] },
  { slug: "dual-boot", term: "Dual boot", group: "install", short: "Dual booting installs Linux next to Windows (or another system) so you choose which one to start when the computer turns on.", more: "Back up first; the installer shrinks your Windows partition to make room.", related: ["live-usb", "secure-boot"], see: [{ label: "Switch from Windows", href: "/switch/windows/" }] },

  // Downloading and installing
  { slug: "iso", proper: true, term: "ISO", aka: ["ISO image", "disk image"], group: "install", short: "An ISO is a single file containing a whole installer, which you write to a USB stick to start the computer from it.", related: ["live-usb", "checksum"], see: [{ label: "How to verify a download", href: "/guides/verify-download/" }] },
  { slug: "live-usb", term: "Live USB", aka: ["live session", "live environment"], group: "install", short: "A live USB runs a distro straight from a USB stick without installing it, so you can try it first.", more: "Check that Wi-Fi, sound, graphics and suspend work before you install.", related: ["iso", "dual-boot"] },
  { slug: "checksum", term: "Checksum", aka: ["SHA256", "hash"], group: "install", short: "A checksum is a fingerprint of a file; if yours matches the one the project publishes, the download is complete and unchanged.", related: ["iso"], see: [{ label: "How to verify a download", href: "/guides/verify-download/" }] },
  { slug: "secure-boot", proper: true, term: "Secure Boot", aka: ["UEFI"], group: "install", short: "Secure Boot is a PC firmware setting that only starts operating systems signed with a trusted key.", more: "Ubuntu, Fedora, Mint and many others boot with it on. Some distros ask you to turn it off in the firmware settings first.", related: ["dual-boot", "iso"] },
];

export const glossaryBySlug = (slug: string) => GLOSSARY.find((t) => t.slug === slug);
export const GLOSSARY_CHECKED = "2026-11-18";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Names that link to a term in running text: the term itself plus aka names that read as words (not tool names in lists). */
function linkNames(): { name: string; slug: string; proper: boolean }[] {
  const out: { name: string; slug: string; proper: boolean }[] = [];
  for (const t of GLOSSARY) {
    if (t.slug === "linux" || t.slug === "distro") continue; // on every page; linking them adds noise
    out.push({ name: t.term, slug: t.slug, proper: !!t.proper });
  }
  return out.sort((a, b) => b.name.length - a.name.length);
}

/**
 * Link the first use of each glossary term in article HTML to its glossary
 * page. Only text inside <p> and <li> is touched; headings, links, code and
 * existing markup are left alone. Each term is linked once per page.
 */
export function linkGlossaryTerms(html: string, max = 8): string {
  const names = linkNames();
  const done = new Set<string>();
  let count = 0;

  /** Link terms in one plain-text run, earliest match first, until none are left. */
  const linkText = (text: string): string => {
    let out = "";
    let rest = text;
    while (count < max) {
      let best: { at: number; len: number; slug: string } | null = null;
      for (const n of names) {
        if (done.has(n.slug)) continue;
        const m = new RegExp(`(^|[^\\w/-])(${escapeRe(n.name)})(?![\\w-])`, n.proper ? "" : "i").exec(rest);
        if (!m) continue;
        const at = m.index + m[1]!.length;
        // Earliest wins; at the same spot the longer name wins (names are sorted longest first).
        if (!best || at < best.at) best = { at, len: m[2]!.length, slug: n.slug };
      }
      if (!best) break;
      out += `${rest.slice(0, best.at)}<a href="/glossary/${best.slug}/" class="term-link">${rest.slice(best.at, best.at + best.len)}</a>`;
      rest = rest.slice(best.at + best.len);
      done.add(best.slug);
      count++;
    }
    return out + rest;
  };

  return html.replace(/<(p|li)(\s[^>]*)?>([\s\S]*?)<\/\1>/g, (block, tag: string, attrs = "", inner: string) => {
    if (count >= max) return block;
    let skip = 0;
    const parts = inner.split(/(<[^>]+>)/).map((part) => {
      if (part.startsWith("<")) {
        if (/^<(a|code|pre)\b/i.test(part)) skip++;
        else if (/^<\/(a|code|pre)>/i.test(part)) skip = Math.max(0, skip - 1);
        return part;
      }
      return skip || !part.trim() ? part : linkText(part);
    });
    return `<${tag}${attrs}>${parts.join("")}</${tag}>`;
  });
}
