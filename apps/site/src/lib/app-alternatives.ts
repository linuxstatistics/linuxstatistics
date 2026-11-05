/**
 * What to use on Linux instead of common Windows and Mac apps.
 * Drafted 2026-11-05, pending owner review. Keep notes short and checkable.
 */
export type Support =
  /** A Linux build from the maker, or a Linux-first open-source app. */
  | "native"
  /** Community-packaged on Flathub, not supported by the maker. */
  | "flatpak"
  /** Works in a web browser. */
  | "web"
  /** The Windows version through Wine or Proton; may break with updates. */
  | "wine"
  /** No good option on Linux. */
  | "none";

export type Platform = "windows" | "mac" | "both";

export type Category =
  | "Office and email"
  | "Photo and design"
  | "Video and audio"
  | "Gaming"
  | "Chat and calls"
  | "Files and cloud"
  | "Apple services"
  | "Developer tools"
  | "System and utilities"
  | "Money and other";

export interface AppOption {
  name: string;
  support: Support;
  note?: string;
}

export interface AppAlternative {
  app: string;
  platform: Platform;
  category: Category;
  options: AppOption[];
}

export const SUPPORT_LABEL: Record<Support, string> = {
  native: "Linux app",
  flatpak: "Community package",
  web: "In the browser",
  wine: "Through Wine",
  none: "No good option",
};

export const SUPPORT_HELP: Record<Support, string> = {
  native: "Made for Linux, or the maker ships a Linux version.",
  flatpak: "Packaged by volunteers on Flathub; the maker doesn't support it.",
  web: "Use the website or web app in Firefox or Chrome.",
  wine: "Runs the Windows version through a compatibility layer. Often works, sometimes breaks after updates.",
  none: "Nothing on Linux does this job well yet.",
};

const o = (name: string, support: Support, note?: string): AppOption => (note ? { name, support, note } : { name, support });

export const APP_ALTERNATIVES: AppAlternative[] = [
  // Office and email
  { app: "Microsoft Word, Excel, PowerPoint", platform: "both", category: "Office and email", options: [o("Microsoft 365 on the web", "web", "Full editing in the browser with a Microsoft account."), o("LibreOffice", "native", "Opens and saves Office files; complex layouts can shift."), o("ONLYOFFICE Desktop", "native", "Looks closer to Microsoft Office.")] },
  { app: "Outlook", platform: "both", category: "Office and email", options: [o("Outlook on the web", "web"), o("Thunderbird", "native", "Works with Microsoft 365 accounts."), o("Evolution", "native", "Supports Exchange accounts.")] },
  { app: "OneNote", platform: "both", category: "Office and email", options: [o("OneNote on the web", "web"), o("Joplin", "native"), o("Obsidian", "native")] },
  { app: "Microsoft To Do", platform: "windows", category: "Office and email", options: [o("To Do on the web", "web"), o("Todoist", "native"), o("Planify", "native")] },
  { app: "Microsoft Visio", platform: "windows", category: "Office and email", options: [o("draw.io Desktop", "native"), o("Visio on the web", "web", "Needs a Microsoft 365 plan.")] },
  { app: "Microsoft Project", platform: "windows", category: "Office and email", options: [o("ProjectLibre", "native", "Opens .mpp files.")] },
  { app: "Adobe Acrobat", platform: "both", category: "Office and email", options: [o("Okular", "native", "Reads, annotates and signs PDFs."), o("Xournal++", "native", "Handwriting and notes on PDFs."), o("Master PDF Editor", "native", "Paid; edits PDF text.")] },
  { app: "Pages, Numbers, Keynote", platform: "mac", category: "Office and email", options: [o("iWork on icloud.com", "web"), o("LibreOffice", "native", "Can open Pages, Numbers and Keynote files.")] },
  { app: "Apple Mail", platform: "mac", category: "Office and email", options: [o("Thunderbird", "native"), o("Evolution", "native")] },
  { app: "Notion", platform: "both", category: "Office and email", options: [o("Notion on the web", "web"), o("AppFlowy", "native", "Open-source alternative.")] },
  { app: "Evernote", platform: "both", category: "Office and email", options: [o("Evernote on the web", "web"), o("Joplin", "native", "Can import Evernote exports.")] },
  { app: "Obsidian", platform: "both", category: "Office and email", options: [o("Obsidian", "native")] },
  { app: "Todoist", platform: "both", category: "Office and email", options: [o("Todoist", "native")] },

  // Photo and design
  { app: "Adobe Photoshop", platform: "both", category: "Photo and design", options: [o("GIMP", "native"), o("Krita", "native", "Strong for painting."), o("Photopea", "web", "Opens PSD files in the browser."), o("Photoshop", "none", "No Linux version; Wine results are poor.")] },
  { app: "Adobe Lightroom", platform: "both", category: "Photo and design", options: [o("darktable", "native"), o("RawTherapee", "native"), o("digiKam", "native", "Library and tagging.")] },
  { app: "Adobe Illustrator", platform: "both", category: "Photo and design", options: [o("Inkscape", "native"), o("Illustrator", "none")] },
  { app: "Adobe InDesign", platform: "both", category: "Photo and design", options: [o("Scribus", "native", "Can't open InDesign files.")] },
  { app: "Affinity Photo, Designer, Publisher", platform: "both", category: "Photo and design", options: [o("Krita, Inkscape, Scribus", "native"), o("Affinity", "none", "No Linux version.")] },
  { app: "Figma", platform: "both", category: "Photo and design", options: [o("Figma in the browser", "web", "Full app; there's no official desktop app for Linux."), o("Penpot", "web", "Open source; can be self-hosted.")] },
  { app: "Canva", platform: "both", category: "Photo and design", options: [o("Canva on the web", "web")] },
  { app: "Paint", platform: "windows", category: "Photo and design", options: [o("Pinta", "native"), o("KolourPaint", "native")] },
  { app: "Paint.NET", platform: "windows", category: "Photo and design", options: [o("Pinta", "native", "Inspired by Paint.NET.")] },
  { app: "Pixelmator Pro", platform: "mac", category: "Photo and design", options: [o("GIMP", "native"), o("Krita", "native")] },
  { app: "Windows Photos", platform: "windows", category: "Photo and design", options: [o("digiKam", "native"), o("Shotwell", "native"), o("gThumb", "native")] },
  { app: "Apple Photos", platform: "mac", category: "Photo and design", options: [o("iCloud Photos on icloud.com", "web"), o("digiKam", "native"), o("Shotwell", "native")] },
  { app: "AutoCAD", platform: "both", category: "Photo and design", options: [o("FreeCAD", "native"), o("LibreCAD", "native", "2D only."), o("BricsCAD", "native", "Paid; reads DWG."), o("AutoCAD", "none")] },
  { app: "Fusion 360, SolidWorks", platform: "both", category: "Photo and design", options: [o("Onshape", "web"), o("FreeCAD", "native"), o("Fusion 360 / SolidWorks", "none")] },
  { app: "SketchUp", platform: "both", category: "Photo and design", options: [o("SketchUp for Web", "web"), o("Blender", "native")] },
  { app: "Blender", platform: "both", category: "Photo and design", options: [o("Blender", "native")] },

  // Video and audio
  { app: "Adobe Premiere Pro", platform: "both", category: "Video and audio", options: [o("DaVinci Resolve", "native", "Free version can't decode H.264/H.265 on Linux; Studio can."), o("Kdenlive", "native"), o("Shotcut", "native")] },
  { app: "Final Cut Pro", platform: "mac", category: "Video and audio", options: [o("DaVinci Resolve", "native"), o("Kdenlive", "native")] },
  { app: "iMovie", platform: "mac", category: "Video and audio", options: [o("Kdenlive", "native"), o("Shotcut", "native"), o("OpenShot", "native")] },
  { app: "Adobe After Effects", platform: "both", category: "Video and audio", options: [o("Blender", "native", "Different workflow."), o("After Effects", "none")] },
  { app: "Windows Media Player, Movies & TV", platform: "windows", category: "Video and audio", options: [o("VLC", "native"), o("mpv", "native")] },
  { app: "QuickTime Player", platform: "mac", category: "Video and audio", options: [o("VLC", "native"), o("mpv", "native")] },
  { app: "OBS Studio", platform: "both", category: "Video and audio", options: [o("OBS Studio", "native")] },
  { app: "Audacity", platform: "both", category: "Video and audio", options: [o("Audacity", "native")] },
  { app: "Adobe Audition", platform: "both", category: "Video and audio", options: [o("Audacity", "native"), o("Ardour", "native")] },
  { app: "FL Studio", platform: "both", category: "Video and audio", options: [o("Bitwig Studio", "native", "Paid."), o("REAPER", "native", "Paid."), o("LMMS", "native"), o("FL Studio", "wine", "Runs in Wine for many users.")] },
  { app: "Ableton Live", platform: "both", category: "Video and audio", options: [o("Bitwig Studio", "native", "Paid; similar workflow."), o("Ableton Live", "wine", "Partly works in Wine; not supported.")] },
  { app: "Logic Pro, GarageBand", platform: "mac", category: "Video and audio", options: [o("Bitwig Studio", "native", "Paid."), o("REAPER", "native", "Paid."), o("Ardour", "native"), o("LMMS", "native")] },
  { app: "Spotify", platform: "both", category: "Video and audio", options: [o("Spotify", "native"), o("Spotify web player", "web")] },
  { app: "iTunes, Apple Music", platform: "both", category: "Video and audio", options: [o("Apple Music on music.apple.com", "web"), o("Rhythmbox, Strawberry", "native", "For your own music files.")] },
  { app: "Apple TV app", platform: "mac", category: "Video and audio", options: [o("tv.apple.com", "web")] },
  { app: "Netflix, Disney+, Prime Video", platform: "both", category: "Video and audio", options: [o("In Firefox or Chrome", "web", "Usually lower resolution than on Windows or Mac.")] },

  // Gaming
  { app: "Steam", platform: "both", category: "Gaming", options: [o("Steam", "native", "Runs most Windows games through Proton.")] },
  { app: "Epic Games Launcher", platform: "windows", category: "Gaming", options: [o("Heroic Games Launcher", "native", "Unofficial; runs Epic and GOG games through Wine.")] },
  { app: "GOG Galaxy", platform: "windows", category: "Gaming", options: [o("Heroic Games Launcher", "native"), o("Lutris", "native")] },
  { app: "Battle.net, EA app, Ubisoft Connect", platform: "windows", category: "Gaming", options: [o("Lutris", "wine"), o("Through Steam as a non-Steam game", "wine")] },
  { app: "Xbox app, PC Game Pass", platform: "windows", category: "Gaming", options: [o("Xbox Cloud Gaming", "web", "Streams games; needs Game Pass Ultimate."), o("PC Game Pass", "none")] },
  { app: "Games with kernel anti-cheat", platform: "windows", category: "Gaming", options: [o("Valorant, Fortnite, many competitive shooters", "none", "Blocked by the game's anti-cheat. Check each game on areweanticheatyet.com.")] },
  { app: "GeForce NOW", platform: "both", category: "Gaming", options: [o("GeForce NOW", "native")] },
  { app: "Logitech G Hub", platform: "windows", category: "Gaming", options: [o("Piper", "native", "Mouse settings."), o("Solaar", "native", "Logitech receivers and devices.")] },
  { app: "Corsair iCUE, Razer Synapse", platform: "windows", category: "Gaming", options: [o("OpenRGB", "native", "Lighting."), o("OpenRazer + Polychromatic", "native", "Razer devices.")] },

  // Chat and calls
  { app: "Microsoft Teams", platform: "both", category: "Chat and calls", options: [o("Teams on the web", "web", "Microsoft retired the Linux app in 2022.")] },
  { app: "Zoom", platform: "both", category: "Chat and calls", options: [o("Zoom", "native")] },
  { app: "Slack", platform: "both", category: "Chat and calls", options: [o("Slack", "native")] },
  { app: "Discord", platform: "both", category: "Chat and calls", options: [o("Discord", "native")] },
  { app: "WhatsApp", platform: "both", category: "Chat and calls", options: [o("WhatsApp Web", "web")] },
  { app: "Signal", platform: "both", category: "Chat and calls", options: [o("Signal Desktop", "native")] },
  { app: "Telegram", platform: "both", category: "Chat and calls", options: [o("Telegram Desktop", "native")] },
  { app: "iMessage", platform: "mac", category: "Apple services", options: [o("iMessage", "none", "Apple doesn't offer it outside its devices.")] },
  { app: "FaceTime", platform: "mac", category: "Apple services", options: [o("FaceTime links", "web", "You can join a call from a link, not start one.")] },

  // Files and cloud
  { app: "OneDrive", platform: "windows", category: "Files and cloud", options: [o("OneDrive on the web", "web"), o("onedrive (abraunegg)", "native", "Unofficial sync client."), o("Insync", "native", "Paid.")] },
  { app: "Google Drive", platform: "both", category: "Files and cloud", options: [o("Google Drive on the web", "web"), o("Insync", "native", "Paid."), o("rclone", "native", "Command line.")] },
  { app: "Dropbox", platform: "both", category: "Files and cloud", options: [o("Dropbox", "native")] },
  { app: "iCloud Drive", platform: "mac", category: "Apple services", options: [o("iCloud Drive on icloud.com", "web"), o("iCloud Drive sync", "none")] },
  { app: "AirDrop", platform: "mac", category: "Apple services", options: [o("LocalSend", "native", "Also on iPhone and Android.")] },
  { app: "Nearby Share, Phone Link", platform: "windows", category: "Files and cloud", options: [o("KDE Connect / GSConnect", "native", "Android phones: files, texts, notifications."), o("LocalSend", "native")] },
  { app: "7-Zip, WinRAR", platform: "windows", category: "Files and cloud", options: [o("Ark, File Roller", "native", "Built into most desktops."), o("7-Zip", "native", "Command line.")] },
  { app: "File Explorer, Finder", platform: "both", category: "Files and cloud", options: [o("Dolphin, Files, Nemo", "native", "Depends on the desktop.")] },

  // Apple services
  { app: "iCloud Notes, Reminders, Calendar", platform: "mac", category: "Apple services", options: [o("icloud.com", "web")] },
  { app: "Keychain, iCloud Passwords", platform: "mac", category: "Apple services", options: [o("Bitwarden", "native"), o("KeePassXC", "native"), o("iCloud Passwords", "none")] },
  { app: "Xcode", platform: "mac", category: "Developer tools", options: [o("Xcode", "none", "Building iPhone and Mac apps needs a Mac.")] },

  // Developer tools
  { app: "Visual Studio Code", platform: "both", category: "Developer tools", options: [o("Visual Studio Code", "native")] },
  { app: "Visual Studio", platform: "windows", category: "Developer tools", options: [o("JetBrains Rider", "native", "Paid; free for non-commercial use."), o("Visual Studio Code", "native")] },
  { app: "JetBrains IDEs", platform: "both", category: "Developer tools", options: [o("JetBrains IDEs", "native")] },
  { app: "Notepad++", platform: "windows", category: "Developer tools", options: [o("Kate", "native"), o("Notepadqq", "native", "Looks like Notepad++."), o("Notepad++", "wine")] },
  { app: "Docker Desktop", platform: "both", category: "Developer tools", options: [o("Docker Engine", "native", "Runs directly on Linux."), o("Podman Desktop", "native")] },
  { app: "Homebrew", platform: "mac", category: "Developer tools", options: [o("Your distro's package manager", "native"), o("Homebrew", "native", "Also works on Linux.")] },
  { app: "PuTTY, Windows Terminal", platform: "windows", category: "Developer tools", options: [o("Built-in terminal and ssh", "native")] },

  // System and utilities
  { app: "Microsoft Store, App Store", platform: "both", category: "System and utilities", options: [o("GNOME Software, KDE Discover", "native", "Install apps from your distro and Flathub.")] },
  { app: "Task Manager, Activity Monitor", platform: "both", category: "System and utilities", options: [o("Mission Center", "native"), o("System Monitor", "native")] },
  { app: "Snipping Tool, macOS screenshots", platform: "both", category: "System and utilities", options: [o("Spectacle, GNOME Screenshot", "native", "Built in."), o("Flameshot", "native")] },
  { app: "File History, Time Machine", platform: "both", category: "System and utilities", options: [o("Déjà Dup, Pika Backup", "native", "Your files."), o("Timeshift", "native", "System snapshots.")] },
  { app: "Spotlight, Alfred, Raycast", platform: "mac", category: "System and utilities", options: [o("KRunner, GNOME search", "native", "Built in."), o("Ulauncher", "native")] },
  { app: "Rectangle, Magnet", platform: "mac", category: "System and utilities", options: [o("Built-in window tiling", "native", "KDE Plasma and most desktops snap windows.")] },
  { app: "TeamViewer, AnyDesk", platform: "both", category: "System and utilities", options: [o("TeamViewer", "native"), o("AnyDesk", "native"), o("RustDesk", "native", "Open source.")] },
  { app: "Remote Desktop (RDP)", platform: "both", category: "System and utilities", options: [o("Remmina", "native"), o("KRDC", "native")] },
  { app: "1Password", platform: "both", category: "System and utilities", options: [o("1Password", "native")] },
  { app: "Bitwarden", platform: "both", category: "System and utilities", options: [o("Bitwarden", "native")] },
  { app: "Proton VPN, Mullvad", platform: "both", category: "System and utilities", options: [o("Proton VPN", "native"), o("Mullvad", "native")] },
  { app: "Google Chrome, Microsoft Edge", platform: "both", category: "System and utilities", options: [o("Chrome", "native"), o("Edge", "native"), o("Firefox", "native", "Default on most distros.")] },
  { app: "Safari", platform: "mac", category: "System and utilities", options: [o("Firefox, Chrome", "native"), o("Safari", "none")] },
  { app: "Antivirus", platform: "windows", category: "System and utilities", options: [o("ClamAV", "native", "Most people don't run antivirus on Linux; install apps from your distro or Flathub and keep updates on. ClamAV can scan files you share with Windows users.")] },

  // Money and other
  { app: "Quicken", platform: "both", category: "Money and other", options: [o("GnuCash", "native"), o("KMyMoney", "native"), o("Quicken Simplifi", "web")] },
  { app: "QuickBooks Desktop", platform: "windows", category: "Money and other", options: [o("QuickBooks Online", "web")] },
  { app: "TurboTax, H&R Block", platform: "both", category: "Money and other", options: [o("Online versions", "web")] },
  { app: "Kindle", platform: "both", category: "Money and other", options: [o("Kindle Cloud Reader", "web"), o("Calibre", "native", "For DRM-free ebooks.")] },
  { app: "iTunes device sync, Finder iPhone sync", platform: "both", category: "Apple services", options: [o("iPhone backup and sync", "none", "Photos can be copied over USB; full backups need a Mac or Windows PC or iCloud.")] },
];

export const CATEGORIES: Category[] = [
  "Office and email",
  "Photo and design",
  "Video and audio",
  "Gaming",
  "Chat and calls",
  "Files and cloud",
  "Apple services",
  "Developer tools",
  "System and utilities",
  "Money and other",
];

export function appsFor(platform: "windows" | "mac"): AppAlternative[] {
  return APP_ALTERNATIVES.filter((a) => a.platform === platform || a.platform === "both");
}

/** The best way to run it on Linux, for a summary chip. */
export function bestSupport(a: AppAlternative): Support {
  const order: Support[] = ["native", "flatpak", "web", "wine", "none"];
  return order.find((s) => a.options.some((x) => x.support === s)) ?? "none";
}
