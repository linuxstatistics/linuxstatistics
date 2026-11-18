/**
 * Driver and Wi-Fi notices shared by both quizzes and the getting-started guide.
 * Each one cites the page it rests on; re-check them when HARDWARE_REVIEWED gets old.
 */
export const HARDWARE_REVIEWED = "2026-11-15";

export const HARDWARE_SOURCES = [
  { name: "NVIDIA legacy driver support (580 is the last for GTX 900/10-series)", href: "https://nvidia.custhelp.com/app/answers/detail/a_id/3142" },
  { name: "Bazzite NVIDIA images and older cards", href: "https://docs.bazzite.gg/General/FAQ/#are-nvidia-graphics-card-drivers-pre-installed" },
  { name: "Arch Linux: NVIDIA 590 drops Pascal and older", href: "https://archlinux.org/news/nvidia-590-driver-drops-pascal-support-main-packages-switch-to-open-kernel-modules/" },
];

export const OLD_NVIDIA_NOTE =
  "NVIDIA's 580 driver is the last to support GTX 900 and GTX 10-series cards (such as the GTX 1050 Ti); newer drivers drop them. Stay on the 580 legacy driver. Rolling-release distros can switch you to a newer driver on update, so check their legacy-driver instructions first. GTX 700-series and older need even older drivers, which most current distros no longer ship.";

export const OLD_NVIDIA_BAZZITE =
  "On Bazzite, GTX 900 and 10-series cards need the NVIDIA image without \"-open\"; GTX 700-series and older aren't supported, so consider Linux Mint or Debian instead.";

export const WIFI_NOTE =
  "Wi-Fi is the most common thing that doesn't work on first boot. Intel chips usually work out of the box; some Broadcom chips and Realtek USB adapters need extra drivers, which free-software-only distros leave out. Check from a live USB before installing, and keep a network cable or phone USB tethering handy for the install.";

export const WIFI_HOW_TO_CHECK =
  "To find your Wi-Fi chip: on Windows, open Device Manager → Network adapters; on a Mac, open System Information → Network → Wi-Fi; from a Linux live USB, run `lspci -k` (or `lsusb` for a USB adapter).";

export const INTEL_MAC_NOTE =
  "Intel Macs can need model-specific drivers for Wi-Fi, the camera and other parts. Check your exact model before installing.";

export const LIVE_USB_NOTE =
  "Try it from a live USB first: Wi-Fi, sound and graphics should all work before you install.";

export type HardwareRisk = "old-nvidia" | "intel-mac" | "wifi";

export interface HardwareRiskInput {
  gpu?: string;
  /** The Wi-Fi chip answer, when asked. */
  wifi?: string;
  intelMac?: boolean;
  /** A free-software-only distro is among the suggestions. */
  fossOnly?: boolean;
  /** A desktop or laptop PC (not a server, Pi or ARM board); Wi-Fi only matters there. */
  desktop?: boolean;
}

/** Hardware risks the answers point to. Empty when nothing specific applies. */
export function hardwareRisks({ gpu, wifi, intelMac, fossOnly, desktop = true }: HardwareRiskInput): HardwareRisk[] {
  const risks: HardwareRisk[] = [];
  if (gpu === "nvidia-old") risks.push("old-nvidia");
  if (intelMac) risks.push("intel-mac");
  const knownGood = wifi === "intel" || wifi === "mediatek";
  if (wifi === "broadcom" || wifi === "realtek" || intelMac || (desktop && fossOnly && !knownGood)) risks.push("wifi");
  return risks;
}

const RISK_HEADING: Record<HardwareRisk, string> = {
  "old-nvidia": "Your older NVIDIA card",
  "intel-mac": "Your Intel Mac",
  wifi: "Your Wi-Fi chip",
};

/** Names the risk when there is one, so the box reads as specific advice, not boilerplate. */
export function hardwareHeading(risks: HardwareRisk[]): string {
  if (risks.length === 1) return RISK_HEADING[risks[0]!];
  // Intel Macs bring the Wi-Fi note with them; that's still one machine to check.
  if (risks.length === 2 && risks.includes("intel-mac") && risks.includes("wifi")) return RISK_HEADING["intel-mac"];
  return "Check these before installing";
}

/** Text in backticks becomes code; used for the notices above. */
export function codeParts(text: string): { text: string; code: boolean }[] {
  return text.split("`").map((part, i) => ({ text: part, code: i % 2 === 1 }));
}
