---
title: "Which Linux distros have no telemetry?"
description: "Which Linux distros send usage data home by default, which ask first, and how to check or turn it off. Checked against each project's own files."
published: 2026-11-18
topic: privacy
alsoIn: ["data"]
type: qa
question: "Which Linux distros have no telemetry?"
answer: "Most Linux distros we checked send no usage data by default. Linux Mint, Pop!_OS, elementary OS, Arch, Debian and MX Linux send nothing unless you opt in. Ubuntu asks during install. Fedora, openSUSE and Zorin send an anonymous install count by default, which you can turn off. Checked against each project's own files, November 2026."
distros: ["mint", "popos", "debian", "arch", "ubuntu", "fedora", "opensuse", "zorin", "mx", "elementary"]
---

We checked 51 operating systems against their own build files, installer code or published statements. **40 of them send nothing unless you agree to it.** The rest send either an anonymous install count or more detailed usage data, and every one of those can be turned off.

This covers what the operating system itself sends. Apps you install, such as a browser, Steam or Snap packages, have their own settings.

## The short list

| What it sends by default | Distros (examples) |
|---|---|
| **Nothing** | Linux Mint, Pop!_OS, elementary OS, Arch, MX Linux, Manjaro, EndeavourOS, CachyOS, NixOS, Void, Alpine, Tails |
| **Nothing unless you say yes** | Ubuntu, Debian, Kubuntu, Xubuntu, Lubuntu, KDE neon, Devuan |
| **An anonymous install count** | Fedora, openSUSE, Zorin OS, Bazzite, Rocky Linux, AlmaLinux, CentOS Stream |
| **Usage or system data** | Red Hat Enterprise Linux (when registered), TrueNAS, ChromeOS |

The full list, with the evidence and a link for each one, is on our [Linux distro telemetry page](/telemetry/).

## What "telemetry" means here

- **Nothing:** the OS doesn't report anything about you or your machine. It still talks to its mirrors when you download updates.
- **Opt-in:** the installer or a settings switch asks first. Ubuntu asks whether to share system data, Debian asks whether to join its package survey, and crash reporters ask before sending each report.
- **Anonymous count:** Fedora and the distros built like it add a counter to the weekly update check, with no ID and no package list, so the project can estimate how many systems run it. openSUSE sends a random installation ID with downloads. Zorin sends an hourly "census" ping.
- **Usage data:** more than a count, such as hardware, storage or installed packages.

## How to turn it off

| Distro | How |
|---|---|
| Fedora, Rocky, Alma, CentOS Stream | Set `countme=0` in the repo files under `/etc/yum.repos.d/` |
| Bazzite, Aurora | `systemctl mask --now rpm-ostree-countme.timer` |
| openSUSE | Empty the file `/var/lib/zypp/AnonymousUniqueId` (don't delete it) |
| Zorin OS | Decline the census in the installer, or `sudo apt remove zorin-os-census` |
| Debian | `sudo dpkg-reconfigure popularity-contest` and answer no |
| TrueNAS | System, General Settings: untick Usage Collection. A smaller report (version and total storage) is still sent. |

## How to check your own system

1. **Look for reporting packages.** On Debian and Ubuntu: `dpkg -l | grep -Ei 'popularity-contest|ubuntu-insights|ubuntu-report|apport|whoopsie'`. On Arch: `pacman -Q pkgstats` (not installed means nothing is sent).
2. **Look for the counter.** On Fedora-family systems: `grep countme /etc/yum.repos.d/*.repo`.
3. **Watch the network.** `sudo ss -tunp` lists open connections and which program owns each one. Anything that isn't your browser, your apps or an update check is worth a look.

A clean list is a good sign, but it isn't proof. A program can still connect for its own reasons, which is why the network check matters.

## Sources and method

Every entry on the [telemetry page](/telemetry/) links the file or statement it is based on. Most were checked in the project's build files, for example the package lists for its install images. Where only the project's own statement was available, the page says so. The list was last checked on 13 November 2026.

If you pick a distro for privacy, the [best Linux for privacy](/best/privacy/) page ranks the options.
