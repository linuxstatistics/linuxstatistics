/** Commands for checking a downloaded image. Replace the file name with yours. */
export const VERIFY_FILE = "linux.iso";

export const SHA256_STEPS: { os: string; where: string; command: string }[] = [
  { os: "Windows", where: "PowerShell (Start menu, type PowerShell)", command: `Get-FileHash .\\${VERIFY_FILE} -Algorithm SHA256` },
  { os: "macOS", where: "Terminal (Applications, Utilities)", command: `shasum -a 256 ${VERIFY_FILE}` },
  { os: "Linux", where: "Terminal", command: `sha256sum ${VERIFY_FILE}` },
];

/** Signature check: proves the checksum list itself came from the project. */
export const GPG_STEPS: { what: string; command: string }[] = [
  { what: "Import the project's signing key (the key ID or file is on its verify page)", command: "gpg --recv-keys KEY_ID" },
  { what: "Check the signature on the checksum list", command: "gpg --verify SHA256SUMS.gpg SHA256SUMS" },
];

/** Last time the commands were checked against each OS's documentation. */
export const VERIFY_CHECKED = "2026-11-16";
