/**
 * Default-desktop screenshots, one per profiled distro, all from Wikimedia
 * Commons with a stated free license (no press kit we checked grants use).
 * Files: public/shots/<slug>-640.webp and -1280.webp, converted once from the
 * Commons original. `width`/`height` are the 1280 version's. `stale`: the
 * newest free screenshot is two or more major releases old; the caption says
 * so. Distros without a usable screenshot have no entry and show none.
 * Checked 2026-11-18.
 */
export const SHOTS_CHECKED = "2026-11-18";

export interface Screenshot {
  /** Release shown, as the caption names it. */
  caption: string;
  desktop: string;
  /** Commons file page. */
  source: string;
  license: string;
  author: string;
  width: number;
  height: number;
  stale?: true;
}

export const SCREENSHOTS: Record<string, Screenshot> = {
  mint: { caption: "Linux Mint 22.3", desktop: "Cinnamon", source: "https://commons.wikimedia.org/wiki/File:Linux_Mint_Cinnamon_22.3.png", license: "GPL", author: "Breno Martins de Oliveira Vasconcelos", width: 1280, height: 540 },
  zorin: { caption: "Zorin OS 18 Core", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:ZorinOS-18-Core.png", license: "CC0", author: "ZoraFlottant", width: 1280, height: 631 },
  ubuntu: { caption: "Ubuntu 26.10", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Ubuntu_26.10_default_desktop_light_-_English.png", license: "GPL", author: "Canonical Limited", width: 1280, height: 720 },
  popos: { caption: "Pop!_OS 24.04 LTS", desktop: "COSMIC", source: "https://commons.wikimedia.org/wiki/File:Pop!_OS_24.04_LTS_default_desktop_-_English.png", license: "GPL", author: "System76", width: 1280, height: 720 },
  fedora: { caption: "Fedora 44 Workstation", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Fedora_44_Workstation.png", license: "GPL", author: "The Fedora Project", width: 1280, height: 720 },
  debian: { caption: "Debian 13 \"trixie\"", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Debian_13.0.0_GNOME_default_desktop_-_English.png", license: "GPL", author: "The Debian Project", width: 1280, height: 871 },
  mx: { caption: "MX Linux 25", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:MX25_screenshot_23_September_2025.png", license: "CC BY 4.0", author: "FullScale4Me", width: 1280, height: 720 },
  cachyos: { caption: "CachyOS (August 2025)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:CachyOS_2025.08.25_KDE_default_desktop_-_English.png", license: "GPL", author: "Peter Jung and the CachyOS Developer Team", width: 1280, height: 720 },
  bazzite: { caption: "Bazzite 42", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Bazzite_42_KDE_default_desktop_-_English.png", license: "GPL", author: "The Bazzite Team", width: 1280, height: 861 },
  endeavour: { caption: "EndeavourOS Ganymede (November 2025)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:EndeavourOS_Ganymede.2025.11.24_KDE_default_desktop_-_English.png", license: "GPL", author: "endeavouros-team", width: 1280, height: 870 },
  manjaro: { caption: "Manjaro 26.0 (German)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Manjaro-26.0.1-Plasma_6.5.4.png", license: "CC BY-SA 4.0", author: "Joshi.gx", width: 1280, height: 720 },
  arch: { caption: "Arch Linux (rolling, December 2024)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Arch_Linux_screenshot,_12.06.2024.png", license: "GPL", author: "Arch Linux developers", width: 1280, height: 720 },
  elementary: { caption: "elementary OS 8.0", desktop: "Pantheon", source: "https://commons.wikimedia.org/wiki/File:ElementaryOS8.0-Desktop.png", license: "GPL", author: "elementary.io", width: 1280, height: 720 },
  opensuse: { caption: "openSUSE Tumbleweed (June 2024)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:OpenSUSE_Tumbleweed_in_KDE_6.jpg", license: "CC BY 4.0", author: "GatoVerde95", width: 1280, height: 720 },
  kdeneon: { caption: "KDE neon (Plasma 6.0)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:KDE_neon_6_Breeze_Desktop_English.png", license: "GPL", author: "KDE", width: 1280, height: 800 },
  kubuntu: { caption: "Kubuntu 26.10", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Kubuntu_26.10_default_desktop_-_English.png", license: "GPL", author: "Kubuntu devs", width: 1280, height: 720 },
  lubuntu: { caption: "Lubuntu 26.10", desktop: "LXQt", source: "https://commons.wikimedia.org/wiki/File:Lubuntu_26.10_default_desktop_-_English.jpg", license: "GPL", author: "Lubuntu Team", width: 1280, height: 720 },
  xubuntu: { caption: "Xubuntu 26.10", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:Xubuntu_26.10_default_desktop_-_English.png", license: "GPL", author: "The Xubuntu Team", width: 1280, height: 720 },
  antix: { caption: "antiX 23.1", desktop: "IceWM", source: "https://commons.wikimedia.org/wiki/File:AntiX_23.1_Full.SysV_default_desktop_-_English.png", license: "GPL", author: "AntiX Devs", width: 1280, height: 725 },
  nixos: { caption: "NixOS 21.11", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:NixOS_21.11_GNOME_default_desktop_-_English.png", license: "GPL", author: "NixOS contributors (NixOS Foundation)", width: 1280, height: 720, stale: true },
  void: { caption: "Void Linux (June 2023 live image)", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:Void_Linux_20230628_default_desktop_-_English.png", license: "GPL", author: "The Void Linux Community", width: 1280, height: 720 },
  garuda: { caption: "Garuda Linux Dr460nized (rolling, December 2024)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Garuda_Linux_Dr460nized,_Bird_of_Prey.png", license: "GPL", author: "Garuda Linux Team", width: 1280, height: 800 },
  tails: { caption: "Tails 7.1", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Tails_7.1_Screenshot_2025-10.png", license: "GPL", author: "Sora Célestinia", width: 1280, height: 800 },
  qubes: { caption: "Qubes OS 4.1.2", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:Qubes_OS_ws_4-1-2.png", license: "GPL", author: "The Qubes OS Project, Invisible Things Labs, Joanna Rutkowska", width: 1280, height: 720, stale: true },
  kali: { caption: "Kali Linux (October 2022)", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:Kali-screenshot-20221021.png", license: "CC0", author: "Barnacl437", width: 1280, height: 720, stale: true },
  alpine: { caption: "Alpine 3.18", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Alpine_Linux_3.18_KDE_-_English.png", license: "GPL", author: "Alpine Linux development team", width: 1280, height: 801, stale: true },
  solus: { caption: "Solus 4.3", desktop: "Budgie", source: "https://commons.wikimedia.org/wiki/File:Solus_Budgie_4.3.jpg", license: "GPL", author: "GetSolus", width: 1280, height: 720, stale: true },
  bluefin: { caption: "Bluefin (February 2026)", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Screenshot_Bluefin_2026-02-16_12-47-39.png", license: "CC BY-SA 4.0", author: "TheMimolet", width: 1280, height: 800 },
  anduin: { caption: "AnduinOS 2.0.3", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:AnduinOS_2.0.3_desktop_screenshot_-_English.png", license: "GPL", author: "Aiursoft Corporation", width: 1280, height: 720 },
  omarchy: { caption: "Omarchy (October 2026)", desktop: "Hyprland", source: "https://commons.wikimedia.org/wiki/File:Try_Omarchy_Default_Desktop.png", license: "CC0", author: "Schützenpanzer", width: 1280, height: 960 },
  artix: { caption: "Artix Linux (rolling, December 2024)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Artix_Linux_screenshot_2024.12.07.png", license: "GPL", author: "Artix Linux developers", width: 1280, height: 720 },
  tuxedo: { caption: "TUXEDO OS 2", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:TUXEDO-OS-2-with-TCC.png", license: "GPL", author: "Chrissss", width: 1280, height: 800, stale: true },
  pclinuxos: { caption: "PCLinuxOS 2020.10", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:PCLinuxOS_2020.10_screenshot.png", license: "GPL", author: "PCLinuxOS developers", width: 1280, height: 720, stale: true },
  sparky: { caption: "SparkyLinux 5.14", desktop: "LXQt", source: "https://commons.wikimedia.org/wiki/File:VirtualBox_SparkyLinux_5.14_LXQT_08_04_2021_20_52_50.png", license: "GPL", author: "PantheraLeo1359531", width: 1280, height: 720, stale: true },
  mageia: { caption: "Mageia 9 (French)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Mageia_9_Plasma.png", license: "CC BY-SA 4.0", author: "Djseb", width: 1280, height: 721 },
  devuan: { caption: "Devuan 5 Daedalus", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:Devuan_Linux_5_Daedalus_default_desktop_-_English.png", license: "GPL", author: "Dyne.org foundation", width: 1280, height: 959 },
  lite: { caption: "Linux Lite 6.4", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:Linux_Lite_desktop-ll64.png", license: "GPL", author: "Jerry Bezencon and team", width: 1280, height: 960 },
  alma: { caption: "AlmaLinux 10.0", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:AlmaLinux_10.0_desktop_with_GNOME_47.png", license: "GPL", author: "Paowee", width: 1280, height: 720 },
  rocky: { caption: "Rocky Linux 10.0 Workstation", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Rocky_Linux_10_Workstation.png", license: "GPL", author: "ZalnaRs", width: 1280, height: 720 },
  gentoo: { caption: "Gentoo Live GUI (2022 build)", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Gentoo_Live_GUI_USB_running_KDE.png", license: "CC BY-SA 3.0", author: "Gentoo and KDE Developers", width: 1280, height: 720 },
  slackware: { caption: "Slackware 15.0", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Slackware_15.0_screenshot.png", license: "GPL", author: "VulcanSphere", width: 1280, height: 720 },
  peppermint: { caption: "Peppermint OS (2025 build)", desktop: "Xfce", source: "https://commons.wikimedia.org/wiki/File:PeppermintOS_Desktop.png", license: "CC0", author: "Peppermintosteam", width: 1280, height: 801 },
  deepin: { caption: "deepin 25 Alpha", desktop: "DDE", source: "https://commons.wikimedia.org/wiki/File:Deepin_Linux_25_Alpha_default_desktop_-_English.png", license: "GPL", author: "Deepin Technology Co., Ltd", width: 1280, height: 865 },
  vanilla: { caption: "Vanilla OS 2 \"Orchid\" (Spanish)", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Vanilla_OS_2_Orchid_en_espa%C3%B1ol.png", license: "CC BY-SA 4.0", author: "Alberto García Fernández", width: 1280, height: 720 },
  raspios: { caption: "Raspberry Pi OS (Debian 13 \"trixie\")", desktop: "labwc (Raspberry Pi desktop)", source: "https://commons.wikimedia.org/wiki/File:Raspberry_Pi_OS_13_screenshot.png", license: "GPL", author: "Raspberry Pi Holdings", width: 1280, height: 720 },
  armbian: { caption: "Armbian 22.05", desktop: "Budgie", source: "https://commons.wikimedia.org/wiki/File:Armbian-desktop.png", license: "GPL", author: "Igor Pecovnik", width: 1280, height: 720, stale: true },
  ubuntustudio: { caption: "Ubuntu Studio 25.04", desktop: "KDE Plasma", source: "https://commons.wikimedia.org/wiki/File:Ubuntu_Studio_25.04.png", license: "GPL", author: "GKCMXLL", width: 1280, height: 720 },
  avlinux: { caption: "AV Linux MXe 23.2", desktop: "Enlightenment", source: "https://commons.wikimedia.org/wiki/File:AV_Linux_-_English.png", license: "GPL", author: "Bandshed", width: 1280, height: 800 },
  tinycore: { caption: "Tiny Core Linux 7.1", desktop: "FLWM", source: "https://commons.wikimedia.org/wiki/File:Tiny_Core_Linux_7.1_screenshot.png", license: "GPL", author: "Tiny Core Linux developers", width: 1024, height: 768, stale: true },
  trisquel: { caption: "Trisquel 12.0", desktop: "MATE", source: "https://commons.wikimedia.org/wiki/File:Trisquel_12.0.png", license: "CC BY-SA 4.0", author: "Defaultlog", width: 1280, height: 800 },
  pureos: { caption: "PureOS 10 \"Byzantium\"", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Pureos-desktop-byzantium.jpg", license: "GPL", author: "Purism", width: 1280, height: 720 },
  endless: { caption: "Endless OS 6.0.4", desktop: "GNOME", source: "https://commons.wikimedia.org/wiki/File:Endless_OS_6.0.4_En_about_-_English.png", license: "GPL", author: "Endless OS Foundation", width: 1280, height: 872 },
  ubuntumate: { caption: "Ubuntu MATE 25.10", desktop: "MATE", source: "https://commons.wikimedia.org/wiki/File:Ubuntu_MATE_25.10_default_desktop_-_English.png", license: "GPL", author: "The Ubuntu MATE Team", width: 1280, height: 720 },
  ubuntubudgie: { caption: "Ubuntu Budgie 26.04 LTS", desktop: "Budgie", source: "https://commons.wikimedia.org/wiki/File:Ubuntu_Budgie_26.04_LTS_default_desktop_-_English.png", license: "GPL", author: "Ubuntu Budgie Team", width: 1280, height: 720 },
};

export const screenshotFor = (slug: string): Screenshot | undefined => SCREENSHOTS[slug];
export const shotSrc = (slug: string, w: 640 | 1280) => `/shots/${slug}-${w}.webp`;
