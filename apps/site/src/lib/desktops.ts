import type { DesktopId } from "@linux-statistics/shared";

/**
 * Desktop explainers for /desktop/<slug>/ and the desktop comparison pages.
 * Checked against each project's own pages on 2026-11-18. Resource ratings
 * are our own: no project publishes a memory figure. Keep claims plain and
 * sourced; leave out anything the project doesn't state.
 */
export const DESKTOPS_CHECKED = "2026-11-18";

export type Weight = "light" | "medium" | "heavy";

export interface DesktopPage {
  slug: string;
  name: string;
  /** Desktop IDs whose distros are listed on this page. */
  ids: DesktopId[];
  /** Glossary term to link, when there is one. */
  glossary?: string;
  summary: string;
  looks: string;
  suits: string[];
  notFor: string[];
  weight: Weight;
  weightNote: string;
  wayland: string;
  madeBy: string;
  fromWindows: string;
  fromMac: string;
  /** Extra sections (the window-manager page lists its options). */
  options?: { name: string; text: string }[];
  sources: { label: string; href: string }[];
}

/** How it runs on older or low-memory computers: our own rating, from how heavy the desktop is. */
export const WEIGHT_HEADING = "On older computers";
export const WEIGHT_LABEL: Record<Weight, string> = { light: "Runs well", medium: "Better on a newer PC", heavy: "Needs a recent PC" };

export const DESKTOP_PAGES: DesktopPage[] = [
  {
    slug: "gnome",
    name: "GNOME",
    ids: ["gnome"],
    glossary: "gnome",
    summary: "A modern, simple desktop with one top bar and a full-screen overview for finding apps and windows. It favors a clean look over many settings.",
    looks: "A thin bar runs across the top with the clock in the middle and system status on the right. Press the Super (Windows) key or click Activities to open the overview, which shows open windows, workspaces, a dock of favorite apps and a search box. You open apps by typing their name or from the app grid.",
    suits: ["People who like a calm, uncluttered screen and keyboard search.", "Laptop and touchpad users, since it leans on gestures and the overview.", "People who want sensible defaults and don't plan to tweak much."],
    notFor: ["You want a taskbar, desktop icons or a start menu without adding extensions.", "You like to change every detail of the layout."],
    weight: "medium",
    weightNote: "Runs well on most computers from the last several years; very old or low-memory machines may feel slow.",
    wayland: "Wayland only. GNOME 49 turned the X11 session off by default and GNOME 50 removed it; X11 apps still run through Xwayland.",
    madeBy: "The GNOME Project, founded in 1997. Current version: GNOME 51, released September 16, 2026.",
    fromWindows: "Feels different at first, because there is no taskbar or start button; most people adjust in a few days.",
    fromMac: "Closer to macOS than Windows, with a top bar, a dock in the overview and Spotlight-style search.",
    sources: [
      { label: "GNOME 51 release notes", href: "https://release.gnome.org/51" },
      { label: "GNOME 49: X11 session disabled", href: "https://release.gnome.org/49/developers/" },
      { label: "Mutter 50: X11 backend dropped", href: "https://download.gnome.org/sources/mutter/50/mutter-50.alpha.news" },
      { label: "About GNOME", href: "https://www.gnome.org/about/" },
    ],
  },
  {
    slug: "kde-plasma",
    name: "KDE Plasma",
    ids: ["kde-plasma"],
    glossary: "kde-plasma",
    summary: "A full-featured desktop with a familiar taskbar and start menu, and more settings than any other major desktop.",
    looks: "By default a panel sits along the bottom with an app launcher on the left, pinned and open apps in the middle, and the system tray and clock on the right. You open apps from the launcher or by typing in KRunner search. Almost every part (panels, widgets, window behavior, themes) can be moved or changed.",
    suits: ["People coming from Windows who want a familiar layout.", "People who like to customize their desktop.", "Gamers and power users who want built-in tools such as screen recording, remote desktop and a system monitor."],
    notFor: ["The number of settings would overwhelm you.", "You need an X11 session (Plasma 6.8 no longer offers one)."],
    weight: "medium",
    weightNote: "Comparable to GNOME in daily use. KDE says Plasma 6.8 uses less memory than before but gives no figure.",
    wayland: "Wayland only since Plasma 6.8, which retired the X11 session; X11 apps still run through Xwayland.",
    madeBy: "The KDE community, making software since 1996. Current version: Plasma 6.8, released October 14, 2026.",
    fromWindows: "Very familiar out of the box, with a bottom taskbar, start menu and system tray.",
    fromMac: "Usable right away, though the default layout is closer to Windows; you can rearrange it into a top bar and dock.",
    sources: [
      { label: "Plasma 6.8 announcement", href: "https://kde.org/announcements/plasma/6/6.8.0" },
      { label: "What is KDE", href: "https://kde.org/community/whatiskde/" },
    ],
  },
  {
    slug: "xfce",
    name: "Xfce",
    ids: ["xfce"],
    glossary: "xfce",
    summary: "A lightweight, traditional desktop that stays fast on older or low-power computers.",
    looks: "Distros set the layout, but most use one panel with an app menu, a window list and a system tray, sometimes with a second panel or a dock. You open apps from the menu or the app finder. It looks plain by default and can be themed.",
    suits: ["Older laptops and desktops.", "People who want a classic menu-and-taskbar desktop that changes little between versions.", "People who value speed over visual effects."],
    notFor: ["You need a solid Wayland session today.", "You want a polished, modern look without theming it yourself."],
    weight: "light",
    weightNote: "Xfce says it aims to be fast and low on system resources.",
    wayland: "X11 is the main session. Wayland support is experimental, and Xfce's own Wayland compositor is in preview releases.",
    madeBy: "The Xfce Development Team. Version 4.20 came out on December 15, 2024; 4.22 is in development.",
    fromWindows: "Familiar, with a menu, taskbar and tray like older versions of Windows.",
    fromMac: "Usable, but feels more like an older Windows desktop unless your distro adds a dock.",
    sources: [
      { label: "About Xfce", href: "https://www.xfce.org/about" },
      { label: "Xfce 4.20 released", href: "https://www.xfce.org/about/news/1734220800/" },
      { label: "Xfce Wayland roadmap", href: "https://wiki.xfce.org/releng/wayland_roadmap" },
    ],
  },
  {
    slug: "cinnamon",
    name: "Cinnamon",
    ids: ["cinnamon"],
    glossary: "cinnamon",
    summary: "A traditional desktop made by the Linux Mint team, with a bottom taskbar and start menu that feels familiar to Windows users.",
    looks: "A panel runs along the bottom with a menu button on the left, pinned and open apps in the middle, and the tray and clock on the right. You open apps from the menu, which has categories, favorites and search. Desktop icons are on by default in Linux Mint.",
    suits: ["Beginners coming from Windows.", "People who want a complete, stable desktop with little setup.", "Linux Mint users, since Mint builds and tests it."],
    notFor: ["You want the newest Wayland features first.", "You use a distro where Cinnamon is a less-tested extra."],
    weight: "medium",
    weightNote: "Heavier than Xfce or MATE, usually lighter than GNOME or KDE Plasma in practice.",
    wayland: "Both. With Cinnamon 6.8 the Mint team no longer calls Wayland experimental, and the X11 session stays.",
    madeBy: "The Linux Mint team, first announced in January 2012. Current version: Cinnamon 6.8.",
    fromWindows: "One of the most familiar choices, close to the Windows 7 and 10 layout.",
    fromMac: "Easy to use, but the layout follows Windows, not macOS.",
    sources: [
      { label: "Linux Mint blog: Wayland in Cinnamon 6.8", href: "https://blog.linuxmint.com/?p=5046" },
      { label: "Introducing Cinnamon (2012)", href: "https://blog.linuxmint.com/?p=1910" },
      { label: "Cinnamon releases", href: "https://github.com/linuxmint/cinnamon/releases" },
    ],
  },
  {
    slug: "mate",
    name: "MATE",
    ids: ["mate"],
    summary: "A continuation of the classic GNOME 2 desktop, simple and light, for people who want a desktop that stays the same.",
    looks: "The classic layout uses two panels: a top panel with Applications, Places and System menus, and a bottom panel with the window list. Some distros, such as Linux Mint and Ubuntu MATE, switch to one bottom panel with a single menu.",
    suits: ["Older or low-power computers.", "People who liked GNOME 2 or want a desktop that rarely changes.", "Schools, offices and shared computers that need something predictable."],
    notFor: ["You want Wayland now.", "You want frequent new features."],
    weight: "light",
    weightNote: "MATE says it runs beautifully on older hardware.",
    wayland: "X11 is the main session. Some MATE parts work under Wayland, but there is no official full MATE Wayland session yet.",
    madeBy: "The MATE Desktop Team, started in 2011. Current stable version: MATE 1.28 (February 2024); the 1.29 development series is active.",
    fromWindows: "Familiar enough, especially with a one-panel layout.",
    fromMac: "The two-panel layout, with menus at the top, feels a little like the macOS menu bar.",
    sources: [
      { label: "MATE Desktop", href: "https://mate-desktop.org/" },
      { label: "About MATE", href: "https://mate-desktop.org/about/" },
      { label: "MATE 1.28 released", href: "https://mate-desktop.org/blog/2024-02-27-mate-1-28-released/" },
    ],
  },
  {
    slug: "cosmic",
    name: "COSMIC",
    ids: ["cosmic"],
    glossary: "cosmic",
    summary: "A new desktop from System76, written in Rust, with a top panel, a dock and built-in window tiling you can turn on or off.",
    looks: "A top panel holds workspaces, the app library and the clock, and a dock sits at the bottom. You open apps from the dock, the Applications library or the launcher search (Super key). Turn tiling on and windows arrange themselves side by side.",
    suits: ["People who want a modern desktop with optional tiling.", "Pop!_OS users and people who buy System76 hardware.", "Curious users who are fine with a young project that changes quickly."],
    notFor: ["You need a long, proven track record.", "You rely on features System76 lists for later releases."],
    weight: "medium",
    weightNote: "System76 says COSMIC is built for performance and efficiency but gives no figure.",
    wayland: "Wayland only; there is no X11 session, and X11 apps run through Xwayland.",
    madeBy: "System76. First stable release (Epoch 1) on December 11, 2025; current version 1.11, released October 20, 2026.",
    fromWindows: "The dock and top panel take a little getting used to, but the launcher and settings are easy to find.",
    fromMac: "Feels familiar, with a top bar, a bottom dock and a Spotlight-style launcher.",
    sources: [
      { label: "COSMIC by System76", href: "https://system76.com/cosmic" },
      { label: "COSMIC Epoch 1", href: "https://system76.com/blog/post/cosmic-epoch-1-updates" },
      { label: "COSMIC releases", href: "https://github.com/pop-os/cosmic-epoch/releases" },
    ],
  },
  {
    slug: "budgie",
    name: "Budgie",
    ids: ["budgie"],
    summary: "A simple, tidy desktop with one panel and a sidebar for notifications and quick widgets.",
    looks: "Distros choose the layout; many use a top or bottom panel with a menu, pinned apps and the tray. A sidebar called Raven slides in from the edge with notifications, media controls and widgets. You open apps from the Budgie Menu or by search.",
    suits: ["People who want a clean desktop that is easy to learn.", "Users of Ubuntu Budgie, Fedora Budgie or Solus.", "People who want something between GNOME's minimalism and KDE Plasma's many options."],
    notFor: ["You want a project in active feature development: Budgie 10 is in maintenance while Budgie 11 is rewritten.", "You need an X11 session."],
    weight: "medium",
    weightNote: "Lighter than KDE Plasma or GNOME in our view, heavier than Xfce.",
    wayland: "Wayland only since Budgie 10.10, which uses the labwc compositor.",
    madeBy: "Buddies of Budgie, first released in 2014. Current version: Budgie 10.10.4, released November 1, 2026. Budgie 11, a rewrite, is in development.",
    fromWindows: "Familiar with a bottom-panel layout; the Raven sidebar works like the Windows notification center.",
    fromMac: "Many distros set it up with a top panel and a dock, which feels close to macOS.",
    sources: [
      { label: "About Budgie Desktop", href: "https://buddiesofbudgie.org/about/budgie-desktop" },
      { label: "Budgie 10.10 released", href: "https://buddiesofbudgie.org/blog/budgie-10-10-released" },
    ],
  },
  {
    slug: "lxqt",
    name: "LXQt",
    ids: ["lxqt"],
    summary: "A lightweight desktop built with Qt, with a classic taskbar and menu, for older computers and people who want speed.",
    looks: "One panel along the bottom holds the main menu, quick launchers, the task list and the tray. You open apps from the menu, which has search, or with the runner. It looks plain by default and uses Qt themes.",
    suits: ["Older or low-memory computers.", "People who want a classic Windows-style layout with few extras.", "People who like Qt and KDE apps but want something lighter than KDE Plasma."],
    notFor: ["You want a polished, all-in-one desktop with many built-in tools.", "You want Wayland to work without picking and setting up a compositor."],
    weight: "light",
    weightNote: "LXQt describes itself as lightweight.",
    wayland: "Both. X11 is the main session, and a Wayland session works with several compositors that LXQt lists as supported.",
    madeBy: "The LXQt team, first released in May 2014. Current version: LXQt 2.5, released November 5, 2026.",
    fromWindows: "Familiar, close to an older Windows taskbar and start menu.",
    fromMac: "Usable, but the layout follows Windows.",
    sources: [
      { label: "About LXQt", href: "https://lxqt-project.org/about/" },
      { label: "LXQt releases", href: "https://lxqt-project.org/releases/" },
    ],
  },
  {
    slug: "window-managers",
    name: "Window managers",
    ids: ["hyprland", "sway", "i3", "niri", "openbox", "icewm", "jwm", "fluxbox", "herbstluftwm", "labwc", "flwm"],
    glossary: "window-manager",
    summary: "A window manager only places and moves windows. It skips the panels, menus and settings apps that a full desktop includes, so you build the rest yourself.",
    looks: "The popular ones tile: new windows fill the screen and split it automatically, side by side or stacked, with no overlap. You move between windows, open apps and change layouts with keyboard shortcuts, and you add a bar and an app launcher yourself.",
    suits: ["Developers and power users who live in the terminal and on the keyboard.", "People with wide or multiple monitors who want every pixel used.", "People who enjoy configuring their own setup in a text file."],
    notFor: ["You are new to Linux and want things to work after install.", "You prefer the mouse, or want settings apps instead of config files."],
    weight: "light",
    weightNote: "A window manager runs far fewer background parts than a full desktop.",
    wayland: "Depends on the window manager: i3 is X11 only; Sway, Hyprland and niri are Wayland only.",
    madeBy: "Separate projects, listed below.",
    fromWindows: "Very different; expect a learning curve of days to weeks.",
    fromMac: "Also very different; closest to third-party macOS tiling tools.",
    options: [
      { name: "i3", text: "A tiling window manager for X11 with strong documentation and a plain look, aimed at advanced users and developers. First released in 2009; current version 4.25.1." },
      { name: "Sway", text: "A tiling Wayland compositor that works as a drop-in replacement for i3 and reads most i3 config files. First released in 2016; current version 1.12." },
      { name: "Hyprland", text: "A dynamic tiling Wayland compositor known for animations, rounded corners and visual effects. First released in 2022; current version 0.57." },
      { name: "niri", text: "A scrollable-tiling Wayland compositor: windows sit in columns on a strip that scrolls sideways, so opening a new window never shrinks the others. First released in 2023." },
    ],
    sources: [
      { label: "i3", href: "https://i3wm.org/" },
      { label: "Sway", href: "https://swaywm.org/" },
      { label: "Hyprland", href: "https://hypr.land/" },
      { label: "niri", href: "https://github.com/niri-wm/niri" },
    ],
  },
];

export const desktopPage = (slug: string) => DESKTOP_PAGES.find((p) => p.slug === slug);

/** The page that covers a desktop ID, if any. */
export function pageForDesktop(id: DesktopId): DesktopPage | undefined {
  return DESKTOP_PAGES.find((p) => p.ids.includes(id));
}

export interface DesktopPair {
  a: string;
  b: string;
  verdict: string;
  aBetter: string[];
  bBetter: string[];
  faq: { q: string; a: string }[];
}

export const pairSlug = (p: { a: string; b: string }) => `${p.a}-vs-${p.b}`;

export const DESKTOP_PAIRS: DesktopPair[] = [
  {
    a: "gnome",
    b: "kde-plasma",
    verdict: "Pick GNOME if you want a clean, focused desktop with good defaults and few choices to make. Pick KDE Plasma if you want a familiar taskbar layout and the freedom to change almost anything.",
    aBetter: ["A simple, uncluttered screen with keyboard search at the center.", "Touchpad gestures and a workflow built around the overview.", "People who don't want to spend time on settings."],
    bBetter: ["People coming from Windows who want a taskbar and start menu.", "Deep customization of panels, widgets, themes and window behavior.", "Built-in extras such as screen recording, remote desktop and a detailed system monitor."],
    faq: [
      { q: "Is KDE Plasma heavier than GNOME?", a: "In daily use they need about the same, and both run better on a computer from the last several years than on an old one. Neither project publishes a memory figure." },
      { q: "Can I install both GNOME and KDE Plasma?", a: "Yes. Most distros let you install both and pick one at the login screen. Expect some duplicate apps, such as two file managers, in your menus." },
      { q: "Do GNOME and KDE Plasma still support X11?", a: "Neither offers an X11 session anymore: GNOME dropped it in GNOME 50 and KDE in Plasma 6.8. Both still run X11 apps through Xwayland." },
    ],
  },
  {
    a: "kde-plasma",
    b: "xfce",
    verdict: "Pick KDE Plasma if your computer is from the last several years and you want a modern, feature-rich desktop. Pick Xfce if your computer is older or low on memory, or you want a simple desktop that changes little.",
    aBetter: ["Modern displays and mixed-scaling monitors.", "Many built-in features and settings.", "A polished look out of the box."],
    bBetter: ["Older or low-power hardware.", "A stable, classic layout that stays the same between versions.", "People who need X11, since Xfce's Wayland support is still experimental."],
    faq: [
      { q: "Is Xfce faster than KDE Plasma?", a: "On older or low-memory computers Xfce usually feels faster, which is why we list Xfce as running well on older computers and KDE Plasma as better on a newer PC. On newer hardware the difference is small." },
      { q: "Does Xfce work on Wayland?", a: "Only experimentally. Xfce's own Wayland compositor is still in preview." },
      { q: "Can I make Xfce look like KDE Plasma?", a: "You can get close with themes, icons and the panel layout. KDE Plasma's widgets and deeper settings have no direct Xfce equivalent." },
    ],
  },
  {
    a: "cinnamon",
    b: "kde-plasma",
    verdict: "Pick Cinnamon if you want a familiar Windows-style desktop that works well with few changes, especially on Linux Mint. Pick KDE Plasma if you want the same familiar layout plus far more options.",
    aBetter: ["Beginners who want fewer settings to think about.", "Linux Mint users, since the Mint team builds and tests it.", "People who want to keep an X11 session as an option."],
    bBetter: ["Deep customization.", "Modern display features under Wayland.", "Using the same desktop across many distros."],
    faq: [
      { q: "Which is more like Windows, Cinnamon or KDE Plasma?", a: "Both use a bottom taskbar and start menu by default. Cinnamon stays close to Windows 7 and 10 with fewer options; KDE Plasma can be adjusted to look more like Windows 10 or 11." },
      { q: "Does Cinnamon support Wayland?", a: "Yes. Since Cinnamon 6.8 the Mint team no longer calls Wayland experimental, and the X11 session is still there." },
      { q: "Is Cinnamon lighter than KDE Plasma?", a: "About the same: both run better on a computer from the last several years. Neither project publishes a memory figure, and results depend on your apps and distro." },
    ],
  },
  {
    a: "gnome",
    b: "cosmic",
    verdict: "Pick GNOME if you want a mature desktop with a long track record and many well-integrated apps. Pick COSMIC if you want a newer desktop with a dock, built-in tiling and more layout options, and you're fine with a young project.",
    aBetter: ["Stability and maturity: GNOME has been around since 1997.", "A large set of well-integrated GNOME apps.", "Wide support across many distros."],
    bBetter: ["Built-in window tiling you can turn on or off.", "A dock and panel layout you can change without extensions.", "Pop!_OS users."],
    faq: [
      { q: "Is COSMIC based on GNOME?", a: "No. COSMIC is its own desktop written in Rust, with its own compositor and toolkit. It still runs GNOME (GTK) apps." },
      { q: "Is COSMIC stable enough for daily use?", a: "Its first stable release came out on December 11, 2025, and updates ship often. It is newer than GNOME, so expect more rough edges." },
      { q: "Do GNOME and COSMIC both use Wayland?", a: "Yes. Both are Wayland only, and both run X11 apps through Xwayland." },
    ],
  },
  {
    a: "xfce",
    b: "lxqt",
    verdict: "Pick Xfce if you want the more established lightweight desktop with GTK apps and broad distro support. Pick LXQt if you prefer Qt apps or want a light desktop with a working Wayland session today.",
    aBetter: ["A long track record and many panel plugins and add-ons.", "GTK apps that match GNOME-family software.", "Wide support as a default desktop across distros."],
    bBetter: ["Qt and KDE apps that look at home.", "A Wayland session you can use now, with your choice of compositor.", "Very low-end machines where every bit of memory counts."],
    faq: [
      { q: "Which is lighter, Xfce or LXQt?", a: "Both run well on older computers. Neither project publishes memory figures, and real use depends more on your apps than on the desktop." },
      { q: "Which one supports Wayland?", a: "LXQt has a Wayland session that works with several compositors. Xfce's Wayland support is experimental." },
      { q: "Can I use Qt apps on Xfce, or GTK apps on LXQt?", a: "Yes. Apps from either toolkit run on both desktops; they may look a little out of place." },
    ],
  },
  {
    a: "cinnamon",
    b: "mate",
    verdict: "Pick Cinnamon if you want a polished traditional desktop with active development and Wayland support. Pick MATE if you want a lighter classic desktop whose layout hasn't changed in years.",
    aBetter: ["A polished look with effects and modern settings.", "Active development with regular new features.", "Wayland support alongside X11."],
    bBetter: ["Older and low-power hardware.", "People who liked GNOME 2 and want it unchanged.", "Shared or managed computers where predictability matters."],
    faq: [
      { q: "Is MATE lighter than Cinnamon?", a: "Yes, in our view: MATE runs well on older computers, while Cinnamon is better on a newer PC. MATE says it runs well on older hardware; neither publishes a memory figure." },
      { q: "Does MATE support Wayland?", a: "Not as a full official session. MATE runs on X11, and some MATE parts work under Wayland." },
      { q: "Which should I pick on Linux Mint?", a: "Linux Mint offers both. Choose Cinnamon on most computers and MATE on older or low-power ones." },
    ],
  },
];
