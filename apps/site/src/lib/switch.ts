import type { QA } from "./faq";
import type { PickerProfile } from "./picker-profiles";

export type From = "windows" | "mac";

/** Dates checked 2026-11-05 against Microsoft's consumer ESU page. */
export const WINDOWS_10 = {
  endOfSupport: "2025-10-14",
  consumerEsuEnds: "2027-10-12",
  source: "https://www.microsoft.com/en-us/windows/extended-security-updates",
} as const;

export const END_OF_10 = "https://endof10.org/";

export interface SwitchPick {
  key: string;
  why: string;
}

/**
 * Hand-picked starting points, in order. Every key must have a picker profile;
 * the page shows the profile blurb plus `why` (what matters to this switcher).
 */
export const SWITCH_PICKS: Record<From, SwitchPick[]> = {
  windows: [
    { key: "mint", why: "Start menu, taskbar and system tray where you expect them." },
    { key: "zorin", why: "Can look like Windows 11 or Windows 7; built for people leaving Windows." },
    { key: "kubuntu", why: "KDE Plasma works much like Windows and is easy to customise." },
    { key: "bazzite", why: "If you mostly game: Steam is set up and updates can be rolled back." },
  ],
  mac: [
    { key: "elementary", why: "Dock, clean design and a curated app store, much like macOS." },
    { key: "zorin", why: "Has a macOS-style layout with a dock and top bar." },
    { key: "ubuntu", why: "GNOME's dock and app overview feel close to Mission Control." },
    { key: "fedora", why: "The base for Fedora Asahi Remix, which runs on Apple Silicon Macs." },
  ],
};

/** Light distros for PCs that can't run Windows 11. */
export const OLDER_PC_PICKS = ["mint", "lubuntu", "xubuntu", "q4os", "mx"];

export function picksFor(from: From, profiles: PickerProfile[]): (SwitchPick & { profile: PickerProfile })[] {
  const byKey = new Map(profiles.map((p) => [p.key, p]));
  return SWITCH_PICKS[from].flatMap((p) => {
    const profile = byKey.get(p.key);
    return profile ? [{ ...p, profile }] : [];
  });
}

export interface ChangeItem {
  title: string;
  body: string;
}

export const WHAT_CHANGES: Record<From, ChangeItem[]> = {
  windows: [
    { title: "Installing apps", body: "Apps come from an app store (Software Center, Discover) instead of downloads from websites. Most popular apps are there, including Firefox, Chrome, Steam, Spotify, Zoom and Discord." },
    { title: "Drivers", body: "Most drivers are built in, so there's usually nothing to install. NVIDIA graphics cards may need the NVIDIA driver; distros like Mint, Pop!_OS and Bazzite make that one click or ship it already." },
    { title: "Gaming", body: "Steam runs most Windows games through Proton. Games with kernel-level anti-cheat (Valorant, Fortnite and many competitive shooters) don't run. Check a game on ProtonDB before you switch." },
    { title: "Your files", body: "Linux reads and writes Windows (NTFS) drives and USB sticks. Office files open in LibreOffice or in Microsoft 365 on the web." },
    { title: "Keep Windows as well", body: "You can install Linux next to Windows (dual boot) and choose at start-up. Back up first, and try Linux from a USB stick before you install." },
    { title: "Updates", body: "Updates cover the whole system and your apps at once, and you choose when to install them. Most don't need a restart." },
  ],
  mac: [
    { title: "Which Macs", body: "Intel Macs run most distros. Apple Silicon (M1 and M2) Macs run Fedora Asahi Remix; newer chips and some hardware (like Thunderbolt) aren't fully supported yet. Check the Asahi Linux feature list for your model." },
    { title: "Keyboard shortcuts", body: "Copy and paste use Ctrl instead of Cmd. GNOME and KDE let you remap keys if you'd rather keep your Mac habits." },
    { title: "Apple services", body: "iMessage and starting FaceTime calls aren't available. iCloud Drive, Photos, Notes and Mail work through icloud.com in the browser. AirDrop can be replaced by LocalSend, which also runs on iPhone." },
    { title: "Installing apps", body: "Apps come from an app store, like the Mac App Store. Homebrew also works on Linux if you use it." },
    { title: "Creative apps", body: "Adobe apps, Final Cut Pro and Logic Pro don't run on Linux. DaVinci Resolve, Blender, Krita, darktable and Bitwig Studio do. See the table below." },
  ],
};

export function switchFaq(from: From): QA[] {
  if (from === "windows")
    return [
      { q: "Is Windows 10 still safe to use?", a: `Windows 10 support ended on ${fmt(WINDOWS_10.endOfSupport)}. Home PCs enrolled in Microsoft's Extended Security Updates get security fixes until ${fmt(WINDOWS_10.consumerEsuEnds)}; after that, there are no more updates.` },
      { q: "My PC can't run Windows 11. Can it run Linux?", a: "Almost certainly. Most distros run well on PCs from the last ten years, and light ones like Lubuntu, Xubuntu and MX Linux run on much older machines." },
      { q: "Which Linux is most like Windows?", a: "Linux Mint (Cinnamon desktop), Zorin OS and Kubuntu all have a Start menu, taskbar and system tray in the usual places." },
      { q: "Can I try Linux without removing Windows?", a: "Yes. Write a distro to a USB stick, start the PC from it and try it without installing. You can then install Linux next to Windows and pick one each time you start." },
      { q: "Will my games work?", a: "Most Steam games do, through Proton. Games with kernel-level anti-cheat, like Valorant and Fortnite, don't. ProtonDB lists reports for each game." },
    ];
  return [
    { q: "Can I run Linux on an Apple Silicon Mac?", a: "Yes, on M1 and M2 Macs, with Fedora Asahi Remix. Support for newer chips is still in progress; check the Asahi Linux site for your model." },
    { q: "Which Linux looks most like macOS?", a: "elementary OS is the closest. Zorin OS has a macOS-style layout, and GNOME (Ubuntu, Fedora) has a dock and an app overview." },
    { q: "Can I use iMessage or FaceTime on Linux?", a: "No. Apple doesn't offer iMessage outside its devices. You can join a FaceTime call from a link in the browser, but not start one." },
    { q: "Do Adobe apps run on Linux?", a: "No. GIMP, Krita, Inkscape, darktable and DaVinci Resolve cover most of the same work, and Photopea opens PSD files in the browser." },
  ];
}

/** "14 October 2025". */
export function fmt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[m! - 1]} ${y}`;
}
