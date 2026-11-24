/**
 * Hand-curated PC parts for the "Can your PC run GTA VI?" check.
 *
 * Tiers are our own coarse grouping (T1 weakest, T9 high end), placed by hand from public
 * benchmark orderings. They are not benchmark scores and not a ranking within a tier:
 * parts in one tier are close enough that a game's requirements don't tell them apart.
 * RDR2's published GPU and CPU names pin T2 (minimum) and T4 (recommended); T7 (GPU) and
 * T6 (CPU) are our estimate for PS5-class hardware. Re-check when MIAMI_REVIEWED gets old.
 */
export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** ok: current open-source or NVIDIA drivers; legacy-nvidia: stuck on NVIDIA's 580 branch; unsupported: too old for Proton's Vulkan layers. */
export type LinuxStatus = "ok" | "legacy-nvidia" | "unsupported";

export const GPU_GROUPS = ["NVIDIA GeForce", "AMD Radeon", "Intel Arc", "Integrated graphics"] as const;
export type GpuGroup = (typeof GPU_GROUPS)[number];

export interface Gpu {
  id: string;
  /** Shown in the picker, without the brand: the group already names it. */
  name: string;
  group: GpuGroup;
  tier: Tier;
  /** GB. Integrated graphics share system memory; this is a typical allocation. */
  vram: number;
  shared: boolean;
  linux: LinuxStatus;
  note?: string;
}

export interface Cpu {
  id: string;
  name: string;
  group: string;
  tier: Tier;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type GpuRow = [name: string, tier: Tier, vram: number, linux?: "L" | "U"];
const gpus = (group: GpuGroup, rows: GpuRow[], shared = false, note?: string): Gpu[] =>
  rows.map(([name, tier, vram, l]) => ({
    id: slug(`${group === "Integrated graphics" ? "igpu" : group.split(" ")[0]}-${name}`),
    name,
    group,
    tier,
    vram,
    shared,
    linux: l === "L" ? "legacy-nvidia" : l === "U" ? "unsupported" : "ok",
    ...(note ? { note } : {}),
  }));

export const GPUS: Gpu[] = [
  ...gpus("NVIDIA GeForce", [
    // Kepler: no current driver, no Vulkan layer Proton can use.
    ["GTX 770 2 GB", 2, 2, "U"],
    ["GTX 780 3 GB", 3, 3, "U"],
    // Maxwell and Pascal: NVIDIA's 580 branch is the last for them.
    ["GTX 750 Ti 2 GB", 1, 2, "L"],
    ["GTX 950 2 GB", 2, 2, "L"],
    ["GTX 960 2 GB", 2, 2, "L"],
    ["GTX 960 4 GB", 2, 4, "L"],
    ["GTX 970 4 GB", 3, 4, "L"],
    ["GTX 980 4 GB", 4, 4, "L"],
    ["GTX 980 Ti 6 GB", 5, 6, "L"],
    ["GT 1030 2 GB", 1, 2, "L"],
    ["GTX 1050 2 GB", 2, 2, "L"],
    ["GTX 1050 Ti 4 GB", 2, 4, "L"],
    ["GTX 1060 3 GB", 3, 3, "L"],
    ["GTX 1060 6 GB", 4, 6, "L"],
    ["GTX 1070 8 GB", 5, 8, "L"],
    ["GTX 1070 Ti 8 GB", 6, 8, "L"],
    ["GTX 1080 8 GB", 6, 8, "L"],
    ["GTX 1080 Ti 11 GB", 7, 11, "L"],
    ["GTX 1650 4 GB", 3, 4],
    ["GTX 1650 Super 4 GB", 4, 4],
    ["GTX 1660 6 GB", 5, 6],
    ["GTX 1660 Super 6 GB", 5, 6],
    ["GTX 1660 Ti 6 GB", 5, 6],
    ["RTX 2060 6 GB", 6, 6],
    ["RTX 2060 Super 8 GB", 6, 8],
    ["RTX 2070 8 GB", 6, 8],
    ["RTX 2070 Super 8 GB", 7, 8],
    ["RTX 2080 8 GB", 7, 8],
    ["RTX 2080 Super 8 GB", 7, 8],
    ["RTX 2080 Ti 11 GB", 8, 11],
    ["RTX 3050 8 GB", 5, 8],
    ["RTX 3060 12 GB", 6, 12],
    ["RTX 3060 Ti 8 GB", 7, 8],
    ["RTX 3070 8 GB", 8, 8],
    ["RTX 3070 Ti 8 GB", 8, 8],
    ["RTX 3080 10 GB", 9, 10],
    ["RTX 3080 Ti 12 GB", 9, 12],
    ["RTX 3090 24 GB", 9, 24],
    ["RTX 4060 8 GB", 7, 8],
    ["RTX 4060 Ti 8 GB", 8, 8],
    ["RTX 4070 12 GB", 9, 12],
    ["RTX 4070 Super 12 GB", 9, 12],
    ["RTX 4070 Ti 12 GB", 9, 12],
    ["RTX 4080 16 GB", 9, 16],
    ["RTX 4090 24 GB", 9, 24],
    ["RTX 5060 8 GB", 8, 8],
    ["RTX 5060 Ti 8 GB", 8, 8],
    ["RTX 5060 Ti 16 GB", 8, 16],
    ["RTX 5070 12 GB", 9, 12],
    ["RTX 5070 Ti 16 GB", 9, 16],
    ["RTX 5080 16 GB", 9, 16],
    ["RTX 5090 32 GB", 9, 32],
    ["RTX 3050 Laptop 4 GB", 4, 4],
    ["RTX 3060 Laptop 6 GB", 6, 6],
    ["RTX 4050 Laptop 6 GB", 5, 6],
    ["RTX 4060 Laptop 8 GB", 6, 8],
    ["RTX 4070 Laptop 8 GB", 7, 8],
    ["RTX 4080 Laptop 12 GB", 8, 12],
    ["RTX 4090 Laptop 16 GB", 9, 16],
  ]),
  ...gpus("AMD Radeon", [
    // GCN 1 and 2: Mesa's Vulkan driver needs experimental kernel flags on these.
    ["R9 280 3 GB", 2, 3, "U"],
    ["R9 280X 3 GB", 2, 3, "U"],
    ["RX 550 2 GB", 1, 2],
    ["RX 560 4 GB", 2, 4],
    ["RX 570 4 GB", 3, 4],
    ["RX 570 8 GB", 3, 8],
    ["RX 470 4 GB", 3, 4],
    ["RX 480 4 GB", 4, 4],
    ["RX 480 8 GB", 4, 8],
    ["RX 580 8 GB", 4, 8],
    ["RX 590 8 GB", 5, 8],
    ["Vega 56 8 GB", 5, 8],
    ["Vega 64 8 GB", 6, 8],
    ["RX 5500 XT 8 GB", 4, 8],
    ["RX 5600 XT 6 GB", 5, 6],
    ["RX 5700 8 GB", 6, 8],
    ["RX 5700 XT 8 GB", 6, 8],
    ["RX 6400 4 GB", 3, 4],
    ["RX 6500 XT 4 GB", 3, 4],
    ["RX 6600 8 GB", 6, 8],
    ["RX 6600 XT 8 GB", 7, 8],
    ["RX 6650 XT 8 GB", 7, 8],
    ["RX 6700 10 GB", 7, 10],
    ["RX 6700 XT 12 GB", 8, 12],
    ["RX 6750 XT 12 GB", 8, 12],
    ["RX 6800 16 GB", 8, 16],
    ["RX 6800 XT 16 GB", 9, 16],
    ["RX 6900 XT 16 GB", 9, 16],
    ["RX 6950 XT 16 GB", 9, 16],
    ["RX 7600 8 GB", 7, 8],
    ["RX 7600 XT 16 GB", 7, 16],
    ["RX 7700 XT 12 GB", 8, 12],
    ["RX 7800 XT 16 GB", 9, 16],
    ["RX 7900 GRE 16 GB", 9, 16],
    ["RX 7900 XT 20 GB", 9, 20],
    ["RX 7900 XTX 24 GB", 9, 24],
    ["RX 9060 XT 8 GB", 8, 8],
    ["RX 9060 XT 16 GB", 8, 16],
    ["RX 9070 16 GB", 9, 16],
    ["RX 9070 XT 16 GB", 9, 16],
  ]),
  ...gpus(
    "Intel Arc",
    [
      ["A380 6 GB", 3, 6],
      ["A580 8 GB", 6, 8],
      ["A750 8 GB", 6, 8],
      ["A770 16 GB", 6, 16],
      ["B570 10 GB", 7, 10],
      ["B580 12 GB", 7, 12],
    ],
    false,
    "Arc needs a recent kernel and Mesa; pick a current distro.",
  ),
  ...gpus(
    "Integrated graphics",
    [
      ["Intel UHD Graphics (UHD 620, 630 and similar)", 1, 1],
      ["Intel Iris Xe (laptop)", 1, 2],
      ["AMD Vega 8 (Ryzen 3000G to 5000G)", 1, 2],
      ["AMD Radeon 680M (Ryzen 6000)", 2, 4],
      ["AMD Radeon 780M (Ryzen 7040)", 3, 4],
      ["AMD Radeon 890M (Ryzen AI 300)", 3, 4],
      ["AMD Radeon 8060S (Ryzen AI Max)", 6, 8],
    ],
    true,
  ),
];

type CpuRow = [name: string, tier: Tier];
const cpus = (group: string, rows: CpuRow[]): Cpu[] => rows.map(([name, tier]) => ({ id: slug(name), name, group, tier }));

export const CPUS: Cpu[] = [
  ...cpus("Intel Core, older", [
    ["Pentium G4560", 1],
    ["Core i3-4130", 1],
    ["Core i3-6100", 1],
    ["Core i5-2500K", 2],
    ["Core i5-3570K", 2],
    ["Core i5-4460", 2],
    ["Core i7-2600K", 3],
    ["Core i7-3770K", 3],
    ["Core i5-4690K", 3],
    ["Core i5-6500", 3],
    ["Core i3-8100", 3],
    ["Core i7-4770K", 4],
    ["Core i7-4790K", 4],
    ["Core i5-6600K", 4],
    ["Core i7-6700K", 4],
    ["Core i5-7600K", 4],
  ]),
  ...cpus("Intel Core, 7th to 11th gen", [
    ["Core i7-7700K", 5],
    ["Core i5-8400", 5],
    ["Core i5-9400F", 5],
    ["Core i3-10100", 5],
    ["Core i5-10400F", 6],
    ["Core i5-10600K", 6],
    ["Core i7-8700K", 6],
    ["Core i7-9700K", 6],
    ["Core i7-10700K", 6],
    ["Core i5-11400F", 6],
    ["Core i7-11700K", 7],
  ]),
  ...cpus("Intel Core, 12th gen and newer", [
    ["Core i3-12100F", 6],
    ["Core i5-12400F", 7],
    ["Core i5-12500", 7],
    ["Core i5-12600K", 8],
    ["Core i5-13400F", 8],
    ["Core i5-14400F", 8],
    ["Core i7-12700K", 9],
    ["Core i7-13700K", 9],
    ["Core i7-14700K", 9],
    ["Core i9-12900K", 9],
    ["Core i9-13900K", 9],
    ["Core i9-14900K", 9],
    ["Core Ultra 5 245K", 8],
    ["Core Ultra 7 265K", 9],
  ]),
  ...cpus("AMD FX and Athlon", [
    ["Athlon 3000G", 1],
    ["FX-4300", 1],
    ["FX-6300", 2],
    ["FX-8350", 2],
  ]),
  ...cpus("AMD Ryzen 1000 to 3000", [
    ["Ryzen 3 1200", 2],
    ["Ryzen 3 2200G", 3],
    ["Ryzen 5 1400", 3],
    ["Ryzen 5 1500X", 4],
    ["Ryzen 5 1600", 4],
    ["Ryzen 5 2400G", 4],
    ["Ryzen 3 3100", 4],
    ["Ryzen 5 2600", 5],
    ["Ryzen 3 3300X", 5],
    ["Ryzen 5 3600", 6],
    ["Ryzen 7 2700X", 6],
    ["Ryzen 7 3700X", 6],
    ["Ryzen 7 3800X", 6],
  ]),
  ...cpus("AMD Ryzen 4000 to 5000", [
    ["Ryzen 5 4500", 6],
    ["Ryzen 5 5500", 6],
    ["Ryzen 5 5600G", 6],
    ["Ryzen 5 5600", 7],
    ["Ryzen 5 5600X", 7],
    ["Ryzen 7 5700X", 7],
    ["Ryzen 7 5800X", 8],
    ["Ryzen 7 5800X3D", 9],
    ["Ryzen 9 5900X", 9],
    ["Ryzen 9 5950X", 9],
  ]),
  ...cpus("AMD Ryzen 7000 and newer", [
    ["Ryzen 5 7500F", 8],
    ["Ryzen 5 7600", 8],
    ["Ryzen 5 7600X", 8],
    ["Ryzen 5 9600X", 8],
    ["Ryzen 7 7700", 8],
    ["Ryzen 7 7800X3D", 9],
    ["Ryzen 7 9800X3D", 9],
    ["Ryzen 9 7900X", 9],
    ["Ryzen 9 7950X", 9],
  ]),
  ...cpus("Laptop CPUs", [
    ["Core i7-8750H", 5],
    ["Core i7-9750H", 5],
    ["Core i5-10300H", 5],
    ["Core i7-10750H", 6],
    ["Core i5-12500H", 7],
    ["Core i7-12700H", 8],
    ["Core i7-13700H", 8],
    ["Ryzen 5 4600H", 6],
    ["Ryzen 7 4800H", 6],
    ["Ryzen 5 5600H", 6],
    ["Ryzen 7 5800H", 7],
    ["Ryzen 7 6800H", 7],
    ["Ryzen 7 7840HS", 8],
  ]),
];

/** RAM sizes offered, GB. */
export const RAM_OPTIONS = [4, 6, 8, 12, 16, 24, 32, 48, 64] as const;

export const gpuById = (id: string | null | undefined): Gpu | undefined => GPUS.find((g) => g.id === id);
export const cpuById = (id: string | null | undefined): Cpu | undefined => CPUS.find((c) => c.id === id);
