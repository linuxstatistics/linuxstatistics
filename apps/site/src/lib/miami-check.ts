import { RAM_OPTIONS, cpuById, gpuById, type Cpu, type Gpu } from "./hardware-tiers";
import { LEVEL_LABEL, LEVEL_SUMMARY, TARGETS, type Level, type Target } from "./miami-targets";
import { OLD_NVIDIA_BAZZITE, OLD_NVIDIA_NOTE } from "./hardware-notes";

export interface Picks {
  gpu: string | null;
  cpu: string | null;
  ram: number | null;
}

export type Part = "gpu" | "cpu" | "ram";

export interface PartResult {
  part: Part;
  /** What the visitor picked, e.g. "RTX 3060 12 GB". */
  label: string;
  level: Level;
  /** One short sentence, e.g. "Meets RDR2 recommended." */
  detail: string;
}

export interface Verdict {
  level: Level;
  label: string;
  summary: string;
  parts: PartResult[];
  /** The lowest part; the first one when parts tie. Null when everything reaches PS5-class. */
  weakest: PartResult | null;
  /** What to improve to reach the next level; null at the top. */
  nextStep: string | null;
  linux: string[];
}

/** The highest target whose threshold the value reaches; 0 when it reaches none. */
function levelFor(value: number, pick: (t: Target) => number): Level {
  let level: Level = 0;
  for (const t of TARGETS) if (value >= pick(t)) level = t.level;
  return level;
}

const DETAIL: Record<Level, string> = {
  0: "Below the RDR2 minimum.",
  1: "Meets the RDR2 minimum.",
  2: "Meets the RDR2 recommended spec.",
  3: "PS5-class or better.",
};

const PART_NAME: Record<Part, string> = { gpu: "graphics card", cpu: "processor", ram: "memory" };

export function gpuLevel(g: Gpu): Level {
  return Math.min(levelFor(g.tier, (t) => t.gpuTier), levelFor(g.vram, (t) => t.vram)) as Level;
}
export const cpuLevel = (c: Cpu): Level => levelFor(c.tier, (t) => t.cpuTier);
export const ramLevel = (gb: number): Level => levelFor(gb, (t) => t.ram);

function linuxLines(gpu: Gpu, ram: number): string[] {
  const lines: string[] = [];
  if (gpu.linux === "ok") {
    lines.push(`${gpu.name.replace(/ \d+ GB$/, "")} works with current Linux graphics drivers (Mesa for AMD and Intel, NVIDIA's own driver for GeForce), which is what Proton's Vulkan layers need.${gpu.note ? ` ${gpu.note}` : ""}`);
  } else if (gpu.linux === "legacy-nvidia") {
    lines.push(OLD_NVIDIA_NOTE, OLD_NVIDIA_BAZZITE);
  } else {
    lines.push(`${gpu.name} is too old for Proton on current Linux: it has no current driver, or only experimental support, for the Vulkan layers Proton relies on. A newer graphics card is the practical fix.`);
  }
  if (ram < 16) lines.push("Your memory is below the 16 GB we suggest for gaming on Linux: Proton compiles shaders as you play, and the desktop uses memory too.");
  return lines;
}

/** Null until every part is chosen. */
export function check(p: Picks): Verdict | null {
  const gpu = gpuById(p.gpu);
  const cpu = cpuById(p.cpu);
  if (!gpu || !cpu || p.ram == null || !RAM_OPTIONS.includes(p.ram as (typeof RAM_OPTIONS)[number])) return null;

  const parts: PartResult[] = [
    { part: "gpu", label: gpu.name, level: gpuLevel(gpu), detail: DETAIL[gpuLevel(gpu)] },
    { part: "cpu", label: cpu.name, level: cpuLevel(cpu), detail: DETAIL[cpuLevel(cpu)] },
    { part: "ram", label: `${p.ram} GB RAM`, level: ramLevel(p.ram), detail: DETAIL[ramLevel(p.ram)] },
  ];
  const level = Math.min(...parts.map((x) => x.level)) as Level;
  const weakest = level === 3 ? null : parts.find((x) => x.level === level)!;
  const next = TARGETS.find((t) => t.level === level + 1);
  const nextStep =
    weakest && next
      ? `Your ${PART_NAME[weakest.part]} holds this PC back. To reach "${next.name}", look for ${
          weakest.part === "gpu" ? next.gpuExamples : weakest.part === "cpu" ? next.cpuExamples : `${next.ram} GB of RAM`
        }.`
      : null;
  return { level, label: LEVEL_LABEL[level], summary: LEVEL_SUMMARY[level], parts, weakest, nextStep, linux: linuxLines(gpu, p.ram) };
}

/** gpu=&cpu=&ram= (from the URL fragment, with or without a leading # or ?) to picks; anything unknown becomes null. */
export function parsePicks(fragment: string): Picks {
  const q = new URLSearchParams(fragment.replace(/^[#?]/, ""));
  const ram = Number(q.get("ram"));
  return {
    gpu: gpuById(q.get("gpu")) ? q.get("gpu") : null,
    cpu: cpuById(q.get("cpu")) ? q.get("cpu") : null,
    ram: (RAM_OPTIONS as readonly number[]).includes(ram) ? ram : null,
  };
}

/** The URL fragment for a set of picks, "" when none. A fragment is never sent to the server. */
export function picksHash(p: Picks): string {
  const q = new URLSearchParams();
  if (p.gpu) q.set("gpu", p.gpu);
  if (p.cpu) q.set("cpu", p.cpu);
  if (p.ram != null) q.set("ram", String(p.ram));
  const s = q.toString();
  return s ? `#${s}` : "";
}
