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

/** Text in backticks becomes code; used for the notices above. */
export function codeParts(text: string): { text: string; code: boolean }[] {
  return text.split("`").map((part, i) => ({ text: part, code: i % 2 === 1 }));
}
