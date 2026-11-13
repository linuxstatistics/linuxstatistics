/**
 * What the operating system itself sends home by default, keyed by
 * distro slug. Only distros checked against the project's own docs are
 * listed; anything missing is "not checked" and the site makes no claim.
 * Apps you install (browsers, Steam…) have their own policies and aren't
 * covered. Checked 2026-11-05 and 2026-11-13, pending maintainer review.
 */
export type TelemetryLevel =
  /** The OS sends no usage data. */
  | "none"
  /** Off unless you agree (asked at install or in settings). */
  | "opt-in"
  /** On by default: an anonymous install count or similar; can be turned off. */
  | "counting"
  /** On by default and more than a count: usage, hardware or package data. */
  | "usage";

export interface TelemetryInfo {
  key: string;
  level: TelemetryLevel;
  /** One plain sentence: what is sent, or that nothing is. */
  detail: string;
  /** How to turn it off, when it's on by default. */
  turnOff?: string;
  source: string;
  /**
   * "build": confirmed in the project's build files or source code.
   * "statement": the project's own published statement only.
   */
  checked: "build" | "statement";
  /** The file or page that was checked, for maintainers. */
  evidence: string;
}

export const TELEMETRY: TelemetryInfo[] = [
  {
    key: "mint",
    level: "none",
    detail: "Linux Mint says the OS collects no telemetry.",
    source: "https://github.com/orgs/linuxmint/discussions/936",
    checked: "statement",
    evidence: "Project statement; ISO package list not checked.",
  },
  {
    key: "popos",
    level: "none",
    detail: "No telemetry or error reports. It only contacts System76, Ubuntu and Flathub to check for updates and to test the network connection, and System76 says nothing from those requests is stored.",
    source: "https://system76.com/privacy",
    checked: "build",
    evidence: "pop-os/iso config/pop-os/24.04.mk and pop-os/desktop debian/control: no ubuntu-report, ubuntu-insights, popularity-contest, apport or whoopsie; snapd and ubuntu-advantage-tools removed.",
  },
  {
    key: "elementary",
    level: "none",
    detail: "elementary says it collects no data from elementary OS.",
    source: "https://elementary.io/privacy",
    checked: "build",
    evidence: "elementary/seeds desktop seed: no telemetry or crash-report packages.",
  },
  {
    key: "arch",
    level: "none",
    detail: "Nothing is sent by default. The optional pkgstats package reports installed packages only if you install it.",
    source: "https://wiki.archlinux.org/title/Pkgstats",
    checked: "build",
    evidence: "archiso releng packages.x86_64 and archinstall installer.py: pkgstats not installed.",
  },
  {
    key: "ubuntu",
    level: "opt-in",
    detail: "The installer asks whether to share anonymous system data (Ubuntu Insights); if you decline, only an opt-out flag is sent. When an app crashes, Ubuntu asks before sending an error report.",
    source: "https://discourse.ubuntu.com/t/ubuntu-insights-how-telemetry-is-changing-on-ubuntu-desktop/73442",
    checked: "build",
    evidence: "ubuntu-seeds desktop-minimal: ubuntu-report, ubuntu-insights, apport-gtk, whoopsie; /etc/default/apport enabled=1; error tracker design: crash prompt by default.",
  },
  {
    key: "debian",
    level: "opt-in",
    detail: "The installer asks whether to join the package usage survey (popularity-contest). It's off unless you agree.",
    source: "https://popcon.debian.org/",
    checked: "build",
    evidence: "popularity-contest debian/templates: participate Default: false.",
  },
  {
    key: "fedora",
    level: "counting",
    detail: "Package updates include an anonymous weekly \"countme\" flag so Fedora can estimate how many systems are in use. No ID or package list is sent. A crash reporter (ABRT) is also installed; its sending is under Settings, Privacy, Diagnostics.",
    turnOff: "Set countme=0 in each repo file under /etc/yum.repos.d/.",
    source: "https://fedoraproject.org/wiki/Changes/DNF_Better_Counting",
    checked: "build",
    evidence: "fedora-repos fedora.repo and fedora-updates.repo: countme=1.",
  },
  {
    key: "bazzite",
    level: "counting",
    detail: "Like Fedora's image-based systems, a timer sends an anonymous \"countme\" ping to estimate the number of systems.",
    turnOff: "Run: systemctl mask --now rpm-ostree-countme.timer",
    source: "https://coreos.github.io/rpm-ostree/countme/",
    checked: "build",
    evidence: "rpm-ostree countme timer docs; ublue-os/countme publishes Bazzite counts from it.",
  },
  {
    key: "aurora",
    level: "counting",
    detail: "Like Fedora's image-based systems, a timer sends an anonymous \"countme\" ping to estimate the number of systems.",
    turnOff: "Run: systemctl mask --now rpm-ostree-countme.timer",
    source: "https://coreos.github.io/rpm-ostree/countme/",
    checked: "build",
    evidence: "rpm-ostree countme timer docs; ublue-os/countme publishes Aurora counts from it.",
  },
  {
    key: "opensuse",
    level: "counting",
    detail: "The package manager sends a random installation ID with every download from openSUSE's servers so it can count installs.",
    turnOff: "Empty the file /var/lib/zypp/AnonymousUniqueId (don't delete it).",
    source: "https://en.opensuse.org/openSUSE:Statistics",
    checked: "build",
    evidence: "libzypp MediaNetworkCommonHandler.cc and commitpackagepreloader.cc: X-ZYpp-AnonymousId header sent to download.opensuse.org and cdn.opensuse.org.",
  },
  {
    key: "zorin",
    level: "counting",
    detail: "An hourly \"census\" ping sends an anonymous installation ID and OS version to count users.",
    turnOff: "Choose \"Don't participate in the census\" in the installer, or run: sudo apt remove zorin-os-census",
    source: "https://zorin.com/legal/privacy/",
    checked: "statement",
    evidence: "Zorin privacy policy (census section).",
  },

  {
    key: "alma",
    level: "counting",
    detail: "AlmaLinux's package manager adds an anonymous counter to its mirror-list request about once a week so the project can estimate how many systems are running; no ID or usage details are sent.",
    turnOff: "Set countme=0 in /etc/yum.repos.d/almalinux-baseos.repo",
    source: "https://git.almalinux.org/rpms/almalinux-release/src/branch/a10/almalinux-baseos.repo",
    checked: "build",
    evidence: "almalinux-release almalinux-baseos.repo (branches a9 and a10) [baseos]: mirrorlist=https://mirrors.almalinux.org/mirrorlist/$releasever/baseos, enabled=1, countme=1.",
  },
  {
    key: "alpine",
    level: "none",
    detail: "Alpine sends no usage data; it only contacts its mirrors for packages and a time server.",
    source: "https://gitlab.alpinelinux.org/alpine/alpine-conf",
    checked: "build",
    evidence: "alpine/alpine-conf (setup-alpine and setup-* scripts, commit dfab2b3): grep for telemetry/popcon/stats/census empty; network steps are setup-apkrepos (mirror pick, optional speed test) and setup-ntp.",
  },
  {
    key: "antix",
    level: "none",
    detail: "antiX sends no usage data; it does not install a package popularity survey or a crash reporter.",
    source: "https://github.com/antiX-Linux/Build-iso/tree/master/Template",
    checked: "build",
    evidence: "antiX-Linux/Build-iso Template/*/*.list (24 package lists incl. COMMON/package.list): no popularity-contest, apport, whoopsie or telemetry package.",
  },
  {
    key: "artix",
    level: "none",
    detail: "Artix sends no usage data; the only default network traffic is package downloads and time sync.",
    source: "https://gitea.artixlinux.org/artix/iso-profiles/src/branch/master/common/common.yaml",
    checked: "build",
    evidence: "iso-profiles common/common.yaml and plasma/profile.yaml: package and service lists contain no popcon/pkgstats/crash-reporter; enabled services are acpid, bluetoothd, cronie, cupsd, syslog-ng, NetworkManager, sddm, ntp. pacman has no countme equivalent.",
  },
  {
    key: "cachyos",
    level: "none",
    detail: "CachyOS sends no usage data; it only contacts its mirrors for updates and to rank mirror speed.",
    source: "https://github.com/CachyOS/CachyOS-Live-ISO/blob/master/archiso/packages_desktop.x86_64",
    checked: "build",
    evidence: "CachyOS-Live-ISO (commit 3215497) archiso/packages_desktop.x86_64: pkgstats absent. CachyOS/cachyos-calamares (commit 1f939eb) settings_online.conf exec list has no 'tracking' module (the upstream module exists in src/modules/tracking but is not used).",
  },
  {
    key: "centos",
    level: "counting",
    detail: "CentOS Stream's package manager adds an anonymous counter to its mirror-list request about once a week so the project can estimate how many systems are running; no ID or usage details are sent.",
    turnOff: "Set countme=0 in /etc/yum.repos.d/centos.repo",
    source: "https://gitlab.com/redhat/centos-stream/rpms/centos-stream-release/-/blob/c10s/centos.repo",
    checked: "build",
    evidence: "centos-stream-release (c10s) centos.repo [baseos]: metalink=https://mirrors.centos.org/metalink?repo=centos-baseos-$stream..., countme=1, enabled=1.",
  },
  {
    key: "chromeos",
    level: "usage",
    detail: "ChromeOS sends usage statistics and crash and diagnostic reports to Google by default, unless you untick the option during setup or turn it off later.",
    turnOff: "Settings, Security and privacy: turn off \"Help improve ChromeOS features and performance\"",
    source: "https://support.google.com/chromebook/answer/96817",
    checked: "build",
    evidence: "chromium/src main chrome/browser/resources/chromeos/login/screens/common/consolidated_consent.ts: property usageChecked defaults to value: true (the setup screen's usage-stats box starts ticked). Google Help 96817 documents the 'Help improve ChromeOS features and performance' toggle for crash/usage reporting.",
  },
  {
    key: "devuan",
    level: "opt-in",
    detail: "Devuan sends no usage data unless you agree, during install, to join its package popularity survey (popcon), which then sends a weekly list of installed packages.",
    source: "https://www.devuan.org/os/documentation/install-guides/excalibur/install-devuan",
    checked: "statement",
    evidence: "Devuan Excalibur install guide step 16: 'Devuan uses popularity contest (popcon) to collect information about the most used packages. This is purely on an opt-in basis'. popcon.devuan.org: join by installing popularity-contest; 'dpkg-reconfigure popularity-contest' to change.",
  },
  {
    key: "endeavour",
    level: "none",
    detail: "EndeavourOS sends no usage data; it only contacts its mirrors for updates.",
    source: "https://github.com/endeavouros-team/EndeavourOS-ISO/blob/main/packages.x86_64",
    checked: "build",
    evidence: "endeavouros-team/EndeavourOS-ISO (commit 0bbb128) packages.x86_64: pkgstats absent. endeavouros-team/calamares (commit 4db9ef7) settings.conf line 130: '#  - tracking' (Calamares tracking module commented out).",
  },
  {
    key: "freebsd",
    level: "none",
    detail: "FreeBSD sends no usage data; it only contacts FreeBSD servers when you fetch updates or packages.",
    source: "https://github.com/freebsd/freebsd-src/tree/main/usr.sbin/bsdinstall/scripts",
    checked: "build",
    evidence: "freebsd-src main usr.sbin/bsdinstall/scripts/auto and scripts/services: the installer service checklist covers local daemons only (sshd, ntpd, moused, powerd, dumpdev = local crash dumps to /var/crash); no reporting or stats service. Network contact is limited to freebsd-update, pkg (pkg.FreeBSD.org) and optional ntpd.",
  },
  {
    key: "garuda",
    level: "none",
    detail: "Garuda Linux sends no usage data; it downloads updates from Arch, Chaotic-AUR and Garuda mirrors and shows update notices.",
    source: "https://gitlab.com/garuda-linux/tools/iso-profiles",
    checked: "build",
    evidence: "iso-profiles master: shared/Packages-Root (chaotic-keyring, chaotic-mirrorlist, garuda-hooks, garuda-hardware-tool, garuda-dracut-support, garuda-config-agent), shared/Packages-Desktop-Common (garuda-setup-assistant, garuda-system-maintenance, garuda-toolbox...) and garuda/dr460nized/Packages-* contain no reporting/popcon/feedback package. pkgbuilds main: garuda-config-agent.py has no HTTP calls; garuda-hooks-runner only rewrites os-release URLs and adds local update notices.",
  },
  {
    key: "gentoo",
    level: "none",
    detail: "Gentoo sends no usage data; it only contacts its mirrors when you sync or download packages.",
    source: "https://github.com/gentoo/releng",
    checked: "build",
    evidence: "gentoo/releng (commit 9cdca68) stage and livecd specs: no gentoostats or other reporting package (grep only hits kernel CONFIG_INTEL_*_TELEMETRY hardware drivers). Gentoo wiki Gentoostats: the old opt-in stats tool is marked historical and is not installed by default.",
  },
  {
    key: "grapheneos",
    level: "none",
    detail: "GrapheneOS sends no analytics or usage data; by default it only makes connectivity checks, time and update checks, and satellite-location downloads, mostly to GrapheneOS servers, and each can be changed in Settings.",
    source: "https://grapheneos.org/faq#default-connections",
    checked: "statement",
    evidence: "grapheneos.org FAQ, 'What kind of connections do the OS and bundled apps make by default?': 'There aren't any analytics/telemetry'. Lists connectivity checks (connectivitycheck.grapheneos.network/generate_204, switchable to Standard/Google or off), network time via time.grapheneos.org, System Updater, PSDS/SUPL location assist, attestation key provisioning.",
  },
  {
    key: "haiku",
    level: "opt-in",
    detail: "Haiku sends no usage data by default; its bundled app store HaikuDepot asks on first launch whether to share anonymous data about which packages you view and install, and the setting starts off.",
    source: "https://www.haiku-os.org/docs/userguide/en/applications/haikudepot.html",
    checked: "build",
    evidence: "haiku/haiku master src/apps/haikudepot/model/Model.cpp: fCanShareAnonymousUsageData(false). ui/MainWindow.cpp: _MaybePromptCanShareAnonymousUserData prompts when the setting is not yet stored and sets it from the answer; ui/SettingsWindow.cpp has the checkbox. User guide: 'Share anonymous usage data with HaikuDepotServer ... increase a counter on how often a package is viewed and installed'.",
  },
  {
    key: "kali",
    level: "none",
    detail: "Kali sends no usage data; its installer explicitly switches off the Debian package survey.",
    source: "https://gitlab.com/kalilinux/build-scripts/live-build-config/-/blob/main/kali-config/common/includes.installer/preseed.cfg",
    checked: "build",
    evidence: "kalilinux/build-scripts/live-build-config (commit adb2e38) kali-config/common/includes.installer/preseed.cfg lines 62-63: '# Disable popularity-contest' / 'popularity-contest popularity-contest/participate boolean false'.",
  },
  {
    key: "kdeneon",
    level: "opt-in",
    detail: "KDE neon sends no usage data by default; its crash reporters (DrKonqi and Apport) ask before sending a report, and Plasma's feedback setting that shares usage statistics with KDE starts off.",
    source: "https://invent.kde.org/neon/neon/seeds/-/blob/Neon/release/desktop",
    checked: "build",
    evidence: "neon/neon/seeds branch Neon/release: desktop seed has '(drkonqi-pk-debug-installer) # Debug installer for drkonqi' and '(neon-apport) # https://phabricator.kde.org/T8659'; desktop-common has '(kerneloops-daemon)'. No ubuntu-insights, ubuntu-report, whoopsie or popularity-contest. STRUCTURE includes platform.noble; installer is Calamares (live seed).",
  },
  {
    key: "kubuntu",
    level: "opt-in",
    detail: "Kubuntu's crash reporters (Apport, Whoopsie and KDE's DrKonqi) ask before sending a report, and it does not ship Ubuntu Insights; separately, a twice-daily news check sends the OS version, kernel and CPU model in its request header.",
    source: "https://git.launchpad.net/~kubuntu-dev/ubuntu-seeds/+git/kubuntu/tree/desktop",
    checked: "build",
    evidence: "kubuntu seeds 'desktop': drkonqi, plasma-welcome, apport, (apport-kde), whoopsie; no ubuntu-insights, ubuntu-report or popularity-contest (Ubuntu's desktop-minimal seed has (ubuntu-insights), Kubuntu's does not). base-files motd/50-motd-news + debian/motd-news.timer (OnCalendar 00,12) with /etc/default/motd-news ENABLED=1: wget to motd.ubuntu.com with User-Agent 'wget/<ver> <NAME>/<VERSION_ID> <uname -o/-r/-m> <cpu model> cloud_id/<id>'.",
  },
  {
    key: "lubuntu",
    level: "opt-in",
    detail: "Lubuntu ships Ubuntu's crash reporters (Apport, whoopsie, kerneloops), which ask before sending a crash report, and it does not ship Ubuntu's install and hardware statistics tool.",
    source: "https://git.launchpad.net/~lubuntu-dev/ubuntu-seeds/+git/lubuntu/tree/desktop-minimal?h=resolute",
    checked: "build",
    evidence: "Lubuntu seed (resolute) desktop-minimal: ' * whoopsie # LP: 1001630', ' * python3-launchpadlib # for apport', ' * kerneloops-daemon'. No ubuntu-insights, ubuntu-report or popularity-contest in lubuntu desktop/desktop-minimal/live/supported/ship-live or in platform minimal/standard/desktop-common. Ubuntu's own seed (ubuntu desktop-minimal) does list (ubuntu-report) and (ubuntu-insights). Installer is Calamares (live seed: calamares-settings-lubuntu), not Ubuntu's Flutter installer. kerneloops.conf in Ubuntu: 'allow-submit = ask'.",
  },
  {
    key: "manjaro",
    level: "none",
    detail: "Manjaro sends no usage data; it only contacts its mirrors for updates.",
    source: "https://gitlab.manjaro.org/profiles-and-settings/iso-profiles",
    checked: "build",
    evidence: "Official gitlab.manjaro.org returned HTTP 502 throughout; checked the GitHub copy manjaro-gnome/iso-profiles (commit 1c304ff, 2026-09-01) shared/Packages-Root, Packages-Desktop, Packages-Live, Packages-Mhwd: no pkgstats, no tracking/telemetry package (grep empty).",
  },
  {
    key: "mx",
    level: "none",
    detail: "MX Linux sends no usage data; it does not install a package popularity survey or a crash reporter on its default Xfce edition.",
    source: "https://github.com/MX-Linux/build-iso-mx/tree/master/Template",
    checked: "build",
    evidence: "MX-Linux/build-iso-mx Template/COMMON/package.list and every edition's package.list: no popularity-contest, apport, whoopsie or telemetry package. Only the KDE templates (mxkde, mxkde-sysv, mxkde-ahs-kernel) list drkonqi.",
  },
  {
    key: "netbsd",
    level: "none",
    detail: "NetBSD sends no usage data; out of the box it does not even run network time sync, and the installer only contacts NetBSD servers to download sets and packages you choose.",
    source: "https://github.com/NetBSD/src/blob/trunk/etc/defaults/rc.conf",
    checked: "build",
    evidence: "etc/defaults/rc.conf: ntpd=NO, ntpdate=NO, sshd=NO, dhcpcd=NO, postfix=YES (local mail only); no reporting daemon. usr.sbin/sysinst/defs.h: only download hosts ftp.NetBSD.org / cdn.NetBSD.org.",
  },
  {
    key: "nixos",
    level: "none",
    detail: "NixOS sends no usage data; it only contacts its package cache and update channels when you rebuild or update.",
    source: "https://github.com/NixOS/calamares-nixos-extensions",
    checked: "build",
    evidence: "NixOS/calamares-nixos-extensions (graphical installer, commit 4c0a875): no telemetry, tracking or stats module or config (grep for telemetry/tracking/stats empty). Default config contacts cache.nixos.org and channels.nixos.org only for downloads.",
  },
  {
    key: "nobara",
    level: "none",
    detail: "Nobara sends no usage data; it gets packages from its own mirrors, and the Fedora repositories that would send Fedora's weekly anonymous count are installed but switched off.",
    source: "https://github.com/Nobara-Project/rpm-sources/blob/44/baseos/fedora-repos/fedora-repos.spec",
    checked: "build",
    evidence: "rpm-sources branch 44: baseos/fedora-repos/fedora.repo and fedora-updates.repo carry countme=1 with enabled=AUTO_VALUE, but fedora-repos.spec sets stable_enabled=0 (upstream Fedora sets 1) for the non-rawhide branch and seds fedora{,-updates}.repo to enabled=0; rawhide/eln/testing also 0. Enabled repos come from baseos/nobara-repos/44/nobara.repo and terra.repo (mirrorlist=https://mirrors.nobaraproject.org/rolling/...), and none of the nobara-repos .repo files contain countme.",
  },
  {
    key: "omarchy",
    level: "none",
    detail: "Omarchy sends no usage data; during setup it asks an Omarchy server to guess your time zone from your network address, and it only uploads logs when you choose to.",
    source: "https://github.com/basecamp/omarchy/blob/master/install/provisioning/setup-form.sh",
    checked: "build",
    evidence: "basecamp/omarchy (commit 8b6ce31): no pkgstats in install/omarchy-base.packages; repo-wide grep for telemetry/analytics/stats finds none for the OS. install/provisioning/setup-form.sh omarchy_prompt_timezone curls https://geo.omarchy.org/ for a timezone guess; bin/omarchy-weather-location uses the same service. bin/omarchy-debug and omarchy-upload-log upload to logs.omarchy.org only after the user picks 'Upload log'. Updates from pkgs.omarchy.org.",
  },
  {
    key: "openbsd",
    level: "none",
    detail: "OpenBSD sends no usage data; after install it fetches firmware and checks for security patches, and its time daemon checks the clock against HTTPS servers.",
    source: "https://github.com/openbsd/src/blob/master/distrib/miniroot/install.sub",
    checked: "build",
    evidence: "distrib/miniroot/install.sub writes fw_update and 'syspatch -c' into /etc/rc.firsttime (cdn.openbsd.org). etc/ntpd.conf: pool.ntp.org, time.cloudflare.com, constraints from 9.9.9.9, 2620:fe::fe and www.google.com. etc/rc.conf: no reporting daemon. The installer offers to mail dmesg to dmesg@openbsd.org only if the user does it by hand (documented in FAQ).",
  },
  {
    key: "parrot",
    level: "none",
    detail: "Parrot OS sends no usage data; package downloads go through Parrot's redirector, which sees each update request and forwards it to a nearby mirror.",
    source: "https://gitlab.com/parrotsec/build/parrot-iso-build",
    checked: "build",
    evidence: "parrot-iso-build master templates/common/package-lists/standard.list.chroot and variant-security/package-lists/security.list.chroot: no popularity-contest, apport or reporting package (only inxi, a local info tool); installer is calamares + calamares-settings-parrot. parrotsec/packages/parrot-core system_configs/apt/sources.list.d/parrot.sources: 'configured by default to use the Parrot servers. They collect all the requests of the users and redirect them to the nearest download server'.",
  },
  {
    key: "proxmox",
    level: "none",
    detail: "Proxmox VE sends no usage data; a daily job checks for package updates, refreshes the container template list and, only on hosts with a subscription key, checks that key with Proxmox.",
    source: "https://git.proxmox.com/?p=pve-manager.git;a=blob;f=bin/pveupdate;hb=HEAD",
    checked: "build",
    evidence: "pve-manager bin/pveupdate (daily pve-daily-update): subscription check runs only if /etc/subscription has an online key; PVE/APLInfo.pm downloads template index from download.proxmox.com and releases.turnkeylinux.org with User-Agent 'PVE/<release>'; then apt update and ACME renewal. No usage-stats code.",
  },
  {
    key: "puppy",
    level: "none",
    detail: "Puppy Linux sends no usage data; its setup tool only checks whether the internet is reachable, and the package manager downloads from mirrors when you use it.",
    source: "https://github.com/puppylinux-woof-CE/woof-CE",
    checked: "build",
    evidence: "woof-CE (testing): no file paths matching telemetry/stats/popcon/census/feedback. Network calls in rootfs-skeleton startup and setup scripts (etc/rc.d, etc/init.d, usr/sbin/quicksetup, delayedrun etc.): only 'wget -q --spider -T 4 http://distro.ibiblio.org' in usr/sbin/quicksetup as an online check.",
  },
  {
    key: "qubes",
    level: "none",
    detail: "Qubes OS sends no usage data because its admin domain has no network access; the project estimates its user count from update-server logs, and you can route updates over Tor to hide your IP.",
    source: "https://doc.qubes-os.org/en/latest/introduction/privacy.html",
    checked: "statement",
    evidence: "Privacy policy, 'Qubes OS': 'Qubes OS does not have the ability to phone home ... dom0 has no network access.' 'Update Servers and Repositories': standard access logs with IPs kept up to 3 months, used for userbase statistics. Statistics page: counts unique IPv4 addresses hitting the update servers per month.",
  },
  {
    key: "raspios",
    level: "none",
    detail: "Raspberry Pi OS sends no usage data; it contacts Raspberry Pi and Debian servers only for updates, and its remote-access client (Raspberry Pi Connect) is installed but stays off until you sign in and turn it on.",
    source: "https://github.com/RPi-Distro/pi-gen",
    checked: "build",
    evidence: "pi-gen master: every stage*/**/00-packages list (stage0 to stage5) has no popularity-contest, apport, whoopsie or other reporting package. stage2/01-sys-tweaks/00-packages includes rpi-connect-lite; raspberrypi/documentation documentation/asciidoc/services/connect/introduction.adoc says the Connect client 'is installed by default on Raspberry Pi OS, but it's turned off until you turn it on and link your device'. stage2/04-cloud-init installs cloud-init (local first-boot config).",
  },
  {
    key: "reactos",
    level: "none",
    detail: "ReactOS sends no usage data; the project states it has no telemetry.",
    source: "https://reactos.org/wiki/Reasons_for_ReactOS",
    checked: "statement",
    evidence: "ReactOS wiki 'Reasons for ReactOS': 'With ReactOS, there is no possibility of unwanted or undocumented telemetry data-mining your system.' Source tree search (reactos/reactos master) found no error-reporting upload client; fxtelemetry.* files are the imported Windows Driver Framework's local ETW tracing, not a network sender.",
  },
  {
    key: "redhat",
    level: "usage",
    detail: "A registered RHEL system checks in with Red Hat every few hours and sends its installed package list, and the installer connects it to Red Hat Insights (Lightspeed), which uploads system configuration data daily.",
    turnOff: "Run: sudo insights-client --unregister",
    source: "https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html/registering_rhel_systems_and_configuring_client_tools_with_red_hat_lightspeed/client-reference",
    checked: "build",
    evidence: "rhinstaller/anaconda (commit 357ab91) pyanaconda/ui/gui/spokes/subscription.py: 'Red Hat Insights should be enabled by default for non-kickstart installs' sets InsightsEnabled = True; subscription.glade insights_checkbox active=True. candlepin/subscription-manager etc-conf/rhsm.conf: report_package_profile = 1, certCheckInterval = 240 (rhsmcertd check-in every 4 h).",
  },
  {
    key: "rocky",
    level: "counting",
    detail: "Rocky Linux's package manager adds an anonymous counter to its mirror-list request about once a week so the project can estimate how many systems are running; no ID or usage details are sent.",
    turnOff: "Set countme=0 in /etc/yum.repos.d/rocky.repo",
    source: "https://git.rockylinux.org/staging/rpms/rocky-release/-/blob/r10/SOURCES/rocky.repo",
    checked: "build",
    evidence: "rocky-release SOURCES/rocky.repo (branches r9 and r10) [baseos]: mirrorlist=https://mirrors.rockylinux.org/mirrorlist?..., enabled=1, countme=1.",
  },
  {
    key: "slackware",
    level: "none",
    detail: "Slackware sends no usage data; it only goes online when you run tools like slackpkg to fetch updates yourself.",
    source: "https://mirrors.slackware.com/slackware/slackware64-15.0/FILELIST.TXT",
    checked: "build",
    evidence: "slackware64-15.0 FILELIST.TXT (full package tree) contains no popcon, crash-reporter (abrt/apport/whoopsie) or telemetry package; slackpkg ships with all mirrors commented out, so not even update checks run until the user picks a mirror.",
  },
  {
    key: "steamos",
    level: "opt-in",
    detail: "SteamOS can send crash and system error reports to Valve, but only if you turn on SteamOS crash reports in Settings.",
    source: "https://lpc.events/event/19/contributions/2149/",
    checked: "statement",
    evidence: "Linux Plumbers 2025 talk 'Proactive and crash-time data collection on Steam Deck' (Igalia, SteamOS contractor), abstract and slides gpiccoli-lpc2025.pdf: kdumpst/pstore crash data, OOM and split-lock events sent to Valve's Sentry instance, 'All of that, opt-in'. Steam Deck setting: Settings > System > SteamOS crash reports. steamos-customizations repo (gitlab.steamos.cloud) needs login, not checked.",
  },
  {
    key: "tails",
    level: "none",
    detail: "Tails sends no usage data; all its traffic goes through Tor, and it only checks for security upgrades.",
    source: "https://tails.net/contribute/design/",
    checked: "statement",
    evidence: "tails.net/contribute/design: all connections go through Tor; tails-security-check (local-includes/usr/local/bin/tails-security-check) and Tails Upgrader fetch upgrade descriptions only; time sync via htpdate over Tor. No reporting component is described.",
  },
  {
    key: "tinycore",
    level: "none",
    detail: "Tiny Core Linux sends no usage data; it only contacts its mirror when you load or update extensions or check for a new version.",
    source: "https://github.com/tinycorelinux/Core-scripts",
    checked: "build",
    evidence: "tinycorelinux/Core-scripts master (all 93 files scanned): every wget targets $MIRROR (tce-load, tce-fetch.sh, tce-update, tce-audit, provides.sh, depends-on.sh, update-everything, version -c checks latest-<build>) or a user-given boot HOST in etc/init.d/tc-config. No other outbound calls.",
  },
  {
    key: "truenas",
    level: "usage",
    detail: "TrueNAS sends a daily usage report (hardware, storage pool sizes, services and apps in use, with a system ID); turning it off reduces the report to the software version and total storage size, and a one-time version ping is sent on first boot.",
    turnOff: "System, General Settings, GUI: untick Usage Collection & UI Error Reporting",
    source: "https://github.com/truenas/middleware/tree/master/src/middlewared/middlewared/plugins/usage",
    checked: "build",
    evidence: "middleware master plugins/usage/submit.py: USAGE_URL = 'https://usage.truenas.com/submit'. run.py: SUBMIT_INTERVAL = 86400; if system.general.config usage_collection is false, restrict_usage = ['gather_total_capacity', 'gather_system_version'] and it still calls submit_stats. firstboot.py posts {platform, system_hash: system.host_id, firstboot: [{version}]}. gather.py gather_system includes 'system_hash'. system_general/update.py: usage_collection None (unset) is reported as enabled unless GPOS STIG mode. Docs (truenas.com/docs/scale/25.10/scaletutorials/systemsettings/general/): 'When disabled, anonymous usage statistics consisting only of the software version and total system capacity ... are collected.'",
  },
  {
    key: "void",
    level: "none",
    detail: "Void sends no usage data; its optional package statistics tool PopCorn is not installed or turned on unless you set it up.",
    source: "https://docs.voidlinux.org/contributing/index.html",
    checked: "build",
    evidence: "void-docs src/contributing/index.md: 'PopCorn is *not* installed or enabled by default on any Void systems.' void-mklive mkiso.sh PKGS lists for all live flavours do not include PopCorn; srcpkgs/PopCorn exists only as an optional package.",
  },
  {
    key: "xubuntu",
    level: "opt-in",
    detail: "Xubuntu ships Ubuntu's crash reporters (Apport and whoopsie), which ask before sending a crash report, and it does not ship Ubuntu's install and hardware statistics tool.",
    source: "https://git.launchpad.net/~xubuntu-dev/ubuntu-seeds/+git/xubuntu/tree/desktop?h=resolute",
    checked: "build",
    evidence: "Xubuntu seed (resolute) desktop, 'Common with Ubuntu': ' * (apport-gtk)', ' * (whoopsie) # http://wiki.ubuntu.com/ErrorTracker'. No ubuntu-insights, ubuntu-report or popularity-contest in xubuntu desktop/desktop-minimal/live or platform seeds; Ubuntu's own desktop-minimal seed does list (ubuntu-report) and (ubuntu-insights). Platform desktop-common adds (kerneloops-daemon), whose conf has 'allow-submit = ask'. Installer: live seed uses snap ubuntu-desktop-bootstrap; in canonical/ubuntu-desktop-provision the telemetry consent page lives in apps/ubuntu_init (OEM first-boot), not the bootstrap installer.",
  },
];

const BY_KEY = new Map(TELEMETRY.map((t) => [t.key, t]));

export function telemetryFor(key: string): TelemetryInfo | null {
  return BY_KEY.get(key) ?? null;
}

export const TELEMETRY_LABEL: Record<TelemetryLevel, string> = {
  none: "None",
  "opt-in": "Off unless you opt in",
  counting: "Anonymous count, on by default",
  usage: "Usage data, on by default",
};

/** True when nothing is sent unless the user chooses to. */
export const sendsNothingByDefault = (t: TelemetryInfo | null) => t != null && (t.level === "none" || t.level === "opt-in");
export const onByDefault = (t: TelemetryInfo | null) => t != null && (t.level === "counting" || t.level === "usage");
