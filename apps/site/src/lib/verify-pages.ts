export interface VerifyPage {
  /** The project's own page with checksums or verify instructions. */
  url: string;
  kind: "checksums" | "instructions" | "both";
  /** The page also covers signature verification (GPG, or minisign for Void). */
  gpg: boolean;
  /** Checksum the project publishes; default SHA256. null = signatures only. */
  hash?: "MD5" | "SHA512" | null;
}

/**
 * Official verify pages, keyed by distro slug, from each project's own site or
 * official repository (checked 2026-11-16). Profiled distros with no such page
 * are listed in NO_VERIFY_PAGE.
 */
export const VERIFY_PAGES: Record<string, VerifyPage> = {
  alma: { url: "https://wiki.almalinux.org/documentation/installation-guide.html", kind: "instructions", gpg: true },
  alpine: { url: "https://alpinelinux.org/downloads/", kind: "checksums", gpg: true },
  anduin: { url: "https://docs.anduinos.com/Install/Download-AnduinOS.html", kind: "instructions", gpg: false },
  antix: { url: "https://antixlinux.com/download/", kind: "both", gpg: true },
  arch: { url: "https://archlinux.org/download/", kind: "both", gpg: true },
  armbian: { url: "https://docs.armbian.com/getting-started/choosing-an-image/", kind: "instructions", gpg: true },
  artix: { url: "https://artixlinux.org/download.php", kind: "both", gpg: true },
  aurora: { url: "https://docs.getaurora.dev/guides/iso-testing", kind: "both", gpg: false },
  avlinux: { url: "https://www.bandshed.net/avlinux/", kind: "both", gpg: true },
  bazzite: { url: "https://docs.bazzite.gg/General/Installation_Guide/install-guide/", kind: "instructions", gpg: false },
  bluefin: { url: "https://docs.projectbluefin.io/downloads", kind: "both", gpg: false },
  cachyos: { url: "https://wiki.cachyos.org/cachyos_basic/download/", kind: "instructions", gpg: true },
  debian: { url: "https://www.debian.org/CD/verify", kind: "both", gpg: true },
  deepin: { url: "https://www.deepin.org/en/download/", kind: "checksums", gpg: false },
  devuan: { url: "https://www.devuan.org/os/documentation/install-guides/excalibur/install-devuan", kind: "instructions", gpg: true },
  dietpi: { url: "https://dietpi.com/docs/install/", kind: "instructions", gpg: false },
  elementary: { url: "https://elementary.io/docs/installation", kind: "instructions", gpg: false },
  endeavour: { url: "https://discovery.endeavouros.com/how-to-check-and-trust-key-and-signature-for-the-endeavouros-iso/", kind: "instructions", gpg: true, hash: "SHA512" },
  endless: { url: "https://support.endlessos.org/en/installation/direct-download", kind: "instructions", gpg: true, hash: null },
  fedora: { url: "https://fedoraproject.org/security/", kind: "both", gpg: true },
  garuda: { url: "https://iso.builds.garudalinux.org/iso/latest/garuda/dr460nized/", kind: "checksums", gpg: false },
  gentoo: { url: "https://www.gentoo.org/downloads/signatures/", kind: "instructions", gpg: true },
  kali: { url: "https://www.kali.org/docs/introduction/download-official-kali-linux-images/", kind: "instructions", gpg: true },
  kdeneon: { url: "https://neon.kde.org/download", kind: "checksums", gpg: true, hash: null },
  kubuntu: { url: "https://kubuntu.org/alternative-downloads/", kind: "checksums", gpg: false },
  lite: { url: "https://www.linuxliteos.com/download.php", kind: "checksums", gpg: false },
  lubuntu: { url: "https://cdimage.ubuntu.com/lubuntu/releases/", kind: "checksums", gpg: true },
  mageia: { url: "https://www.mageia.org/en/downloads/get/?q=Mageia-9-x86_64.iso", kind: "instructions", gpg: true, hash: "SHA512" },
  manjaro: { url: "https://forum.manjaro.org/t/root-tip-how-to-forum-mini-guide-to-verify-iso-signature/146680", kind: "instructions", gpg: true },
  mint: { url: "https://linuxmint-installation-guide.readthedocs.io/en/latest/verify.html", kind: "instructions", gpg: true },
  mx: { url: "https://mxlinux.org/wiki/system/signed-iso-files/", kind: "instructions", gpg: true },
  nitrux: { url: "https://nxos.org/documentation/getting-started/installation-guide/validate-iso/authenticity/", kind: "instructions", gpg: true },
  nixos: { url: "https://nixos.org/download/", kind: "checksums", gpg: false },
  nobara: { url: "https://nobaraproject.org/download.html", kind: "checksums", gpg: false },
  omarchy: { url: "https://omarchy.org/", kind: "checksums", gpg: true },
  opensuse: { url: "https://doc.opensuse.org/documentation/tumbleweed/image_choice/", kind: "instructions", gpg: true },
  parrot: { url: "https://parrotsec.org/docs/configuration/hash-and-key-verification/", kind: "instructions", gpg: true },
  peppermint: { url: "https://peppermintos.com/trixie-base-downloads/", kind: "both", gpg: true, hash: "SHA512" },
  pikaos: { url: "https://wiki.pika-os.com/en/how-to-verify-ISO-integrity-using-MD5", kind: "instructions", gpg: false, hash: "MD5" },
  popos: { url: "https://system76.com/support/live-disk/", kind: "instructions", gpg: false },
  puppy: { url: "https://wikka.puppylinux.com/VerificationCommands", kind: "instructions", gpg: true },
  pureos: { url: "https://pureos.net/download/", kind: "checksums", gpg: false },
  q4os: { url: "https://www.q4os.org/downloads1.html", kind: "checksums", gpg: false, hash: "MD5" },
  qubes: { url: "https://doc.qubes-os.org/en/latest/project-security/verifying-signatures.html", kind: "instructions", gpg: true },
  raspios: { url: "https://www.raspberrypi.com/software/operating-systems/", kind: "checksums", gpg: false },
  rocky: { url: "https://docs.rockylinux.org/guides/installation/", kind: "instructions", gpg: false },
  solus: { url: "https://getsol.us/download/", kind: "checksums", gpg: true },
  sparky: { url: "https://wiki.sparkylinux.org/doku.php/verify_iso", kind: "instructions", gpg: true },
  tails: { url: "https://tails.net/install/expert/index.en.html", kind: "instructions", gpg: true },
  tinycore: { url: "http://www.tinycorelinux.net/16.x/x86/release/", kind: "checksums", gpg: false, hash: "MD5" },
  trisquel: { url: "https://trisquel.info/en/wiki/download-trisquel", kind: "instructions", gpg: true },
  tuxedo: { url: "https://os.tuxedocomputers.com/checksums/", kind: "both", gpg: true },
  ubuntu: { url: "https://ubuntu.com/tutorials/how-to-verify-ubuntu", kind: "instructions", gpg: true },
  ubuntubudgie: { url: "https://ubuntubudgie.org/downloads/", kind: "checksums", gpg: false },
  ubuntumate: { url: "https://ubuntu-mate.org/download/", kind: "checksums", gpg: false },
  ubuntustudio: { url: "https://ubuntustudio.org/download/", kind: "checksums", gpg: false },
  ultramarine: { url: "https://wiki.ultramarine-linux.org/en/setup/getting/", kind: "instructions", gpg: false },
  vanilla: { url: "https://github.com/Vanilla-OS/live-iso/releases", kind: "checksums", gpg: false },
  void: { url: "https://docs.voidlinux.org/installation/index.html", kind: "instructions", gpg: true },
  xubuntu: { url: "https://xubuntu.org/download/", kind: "checksums", gpg: false },
  zorin: { url: "https://help.zorin.com/docs/getting-started/check-the-integrity-of-your-copy-of-zorin-os/", kind: "instructions", gpg: false },
};

/** Profiled distros whose own site publishes no checksum or verify page (checked 2026-11-16). */
export const NO_VERIFY_PAGE = ["pclinuxos", "slackware"] as const;

export const verifyFor = (slug: string): VerifyPage | null => VERIFY_PAGES[slug] ?? null;

/** Short label for what the page lets you check, e.g. "SHA256 and signature". */
export function verifyLabel(v: VerifyPage): string {
  const hash = v.hash === undefined ? "SHA256" : v.hash;
  if (hash === null) return v.gpg ? "Signature" : "Official files";
  return v.gpg ? `${hash} and signature` : hash;
}
