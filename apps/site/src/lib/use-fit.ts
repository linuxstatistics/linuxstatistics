import type { PickerProfile, Use } from "./picker-profiles";
import { telemetryFor } from "./telemetry";

/** Same order as the quiz's "What's it mainly for?" question. */
export const USES: { use: Use; label: string }[] = [
  { use: "everyday", label: "Everyday use" },
  { use: "gaming", label: "Gaming" },
  { use: "old-hw", label: "Older computers" },
  { use: "dev", label: "Programming" },
  { use: "ai", label: "AI & Local LLMs" },
  { use: "server", label: "Servers & home labs" },
  { use: "privacy", label: "Privacy & security" },
  { use: "creative", label: "Music, video & graphics" },
];

export const isUse = (x: string | null | undefined): x is Use => USES.some((u) => u.use === x);

export type Verdict = "good" | "ok" | "poor";
export const VERDICT_TEXT: Record<Verdict, string> = { good: "Good fit", ok: "Can work", poor: "Not the best fit" };

export interface UseFit {
  use: Use;
  label: string;
  verdict: Verdict;
  pros: string[];
  cons: string[];
}

const ram = (gb: number) => (gb < 1 ? `${gb * 1024} MB` : `${gb} GB`);

/**
 * Pros and cons of one distro for one use, built only from the curated
 * profile and telemetry facts, so every line is as checkable as the profile.
 */
export function useFit(p: PickerProfile, use: Use): UseFit {
  const pros: string[] = [];
  const cons: string[] = [];
  const tagged = p.uses.includes(use);
  const beginner = p.levels.includes("new");
  const expertOnly = p.levels.length === 1 && p.levels[0] === "expert";
  let poor = false;

  switch (use) {
    case "everyday":
      if (tagged) pros.push("Made for day-to-day desktop use");
      if (beginner) pros.push("Easy to set up if you're new to Linux");
      if (p.desktops.includes("windows-like")) pros.push("Windows-style desktop that feels familiar");
      else if (p.desktops.includes("mac-like")) pros.push("macOS-style desktop that feels familiar");
      if (p.undo) pros.push(p.undo === "rollback" ? "Updates roll back if something breaks" : "Snapshots let you undo a bad update");
      if (expertOnly) cons.push("Expects you to set things up yourself");
      if (p.updates === "rolling" && !expertOnly) cons.push("Rolling updates change things more often");
      if (!tagged) cons.push("Not mainly built as an everyday desktop");
      poor = expertOnly && !tagged;
      break;
    case "gaming":
      if (tagged) pros.push("Built with gaming in mind");
      if (p.nvidia === "excellent") pros.push("NVIDIA drivers set up for you");
      if (p.updates === "rolling") pros.push("New kernels and graphics drivers arrive quickly");
      if (p.undo) pros.push("A bad driver update can be undone");
      if (p.nvidia === "poor") cons.push("NVIDIA cards are poorly supported");
      else if (p.nvidia === "fair") cons.push("NVIDIA drivers need setting up yourself");
      if (p.updates === "stable" && !tagged) cons.push("Graphics drivers and kernels update more slowly");
      if (!tagged) cons.push("Steam and gaming tweaks are up to you");
      poor = p.nvidia === "poor" || p.uses.includes("server") && !p.uses.includes("everyday");
      break;
    case "old-hw":
      if (p.minRamGb <= 1) pros.push(`Runs in about ${ram(p.minRamGb)} of RAM`);
      if (p.platforms.includes("pc32")) pros.push("Still makes 32-bit images for very old PCs");
      if (p.desktops.includes("light")) pros.push("Offers a lightweight desktop");
      if (p.minRamGb >= 4) cons.push(`Needs about ${ram(p.minRamGb)} of RAM to feel smooth`);
      if (!p.platforms.includes("pc32")) cons.push("No 32-bit images");
      poor = p.minRamGb >= 4;
      break;
    case "dev":
      if (tagged) pros.push("Popular with developers");
      if (p.updates === "rolling") pros.push("Newest compilers, languages and tools");
      else pros.push("A stable base that doesn't change under you");
      if (p.undo === "rollback") pros.push("Experiment freely: the system rolls back");
      if (p.platforms.includes("arm")) pros.push("Also runs on ARM machines");
      if (p.updates === "stable" && !tagged) cons.push("Language and tool versions can lag behind");
      if (p.undo === "rollback") cons.push("Installing system-level tools works differently (containers or layering)");
      if (!tagged) cons.push("Fewer developer guides than the big distros");
      break;
    case "ai":
      if (tagged) pros.push("A common choice for running models locally");
      if (p.cuda) pros.push("CUDA available from NVIDIA's or the distro's own packages");
      if (p.rocm) pros.push("AMD ROCm supported or packaged");
      if (p.nvidia === "excellent") pros.push("NVIDIA driver set up for you");
      if (!p.cuda) cons.push("No official CUDA packages, so NVIDIA AI tools need workarounds");
      if (!p.rocm) cons.push("AMD ROCm isn't officially supported");
      if (p.minRamGb >= 8) cons.push("Heavy system before you load a model");
      poor = !p.cuda && !p.rocm;
      break;
    case "server":
      if (tagged) pros.push("Widely used on servers");
      if (p.updates === "stable") pros.push("Fixed releases with tested updates");
      if (p.platforms.includes("arm") || p.platforms.includes("pi")) pros.push("Runs on ARM boards and Raspberry Pi");
      if (p.minRamGb <= 1) pros.push("Small footprint");
      if (p.updates === "rolling") cons.push("Rolling updates mean more upkeep on a server");
      if (!tagged) cons.push("Mainly a desktop system");
      poor = !tagged && p.updates === "rolling";
      break;
    case "privacy": {
      const t = telemetryFor(p.key);
      if (tagged) pros.push("Built with privacy or security as the goal");
      if (p.fossOnly) pros.push("Only free software, so everything can be audited");
      if (t?.level === "none") pros.push("Sends no usage data");
      else if (t?.level === "opt-in") pros.push("Sends no usage data unless you agree");
      if (t?.level === "counting") cons.push("Counts installs by default (can be turned off)");
      else if (t?.level === "usage") cons.push("Sends usage data by default");
      else if (!t) cons.push("Usage data not checked by us yet");
      if (!tagged) cons.push("Privacy tools like Tor or sandboxing are up to you");
      break;
    }
    case "creative":
      if (tagged) pros.push("Audio, video and graphics tools installed and tuned");
      if (p.updates === "rolling") pros.push("New versions of creative apps arrive quickly");
      if (!tagged) cons.push("Creative apps and low-latency audio setup are up to you");
      if (p.nvidia === "poor") cons.push("NVIDIA GPU acceleration is hard to set up");
      break;
  }

  const verdict: Verdict = tagged ? "good" : poor ? "poor" : "ok";
  return { use, label: USES.find((u) => u.use === use)!.label, verdict, pros: pros.slice(0, 4), cons: cons.slice(0, 3) };
}

export const useFits = (p: PickerProfile): UseFit[] => USES.map(({ use }) => useFit(p, use));
