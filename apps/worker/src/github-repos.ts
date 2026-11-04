/**
 * Curated repository per distro (by DistroWatch key). Pick the repo that best
 * stands for the distro's own work (installer, desktop, tooling), not upstream
 * projects it ships. Checked against the GitHub API on 2026-11-03.
 */
export const GITHUB_REPOS: { key: string; repo: string }[] = [
  { key: "cachyos", repo: "CachyOS/CachyOS-Settings" },
  { key: "mint", repo: "linuxmint/cinnamon" },
  { key: "mx", repo: "MX-Linux/mx-packageinstaller" },
  { key: "popos", repo: "pop-os/shell" },
  { key: "fedora", repo: "rpm-software-management/dnf" },
  { key: "endeavour", repo: "endeavouros-team/EndeavourOS-ISO" },
  { key: "manjaro", repo: "manjaro/pamac" },
  { key: "arch", repo: "archlinux/archinstall" },
  { key: "opensuse", repo: "openSUSE/openSUSE-release-tools" },
  { key: "elementary", repo: "elementary/os" },
  { key: "garuda", repo: "garuda-linux/garuda-tools" },
];
