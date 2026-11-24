/**
 * What "Can your PC run GTA VI?" compares against. GTA VI came out on PS5 and Xbox Series X|S
 * on 2026-11-19; Rockstar has announced no PC version and no PC specs. So the targets are
 * Red Dead Redemption 2's published PC requirements (the same studio and engine lineage)
 * plus our own estimate for PS5-class hardware. Re-check all of this when MIAMI_REVIEWED gets
 * old, and replace the targets with Rockstar's numbers the day they exist.
 */
export const MIAMI_REVIEWED = "2026-11-24";

export const MIAMI_NAME = "GTA VI";

/** Level 1 to 3: which target a part reaches. 0 means below the RDR2 minimum. */
export type Level = 0 | 1 | 2 | 3;

export interface Target {
  level: 1 | 2 | 3;
  id: "rdr2-min" | "rdr2-rec" | "ps5";
  name: string;
  /** Our estimate, not a published number. */
  estimate: boolean;
  /** Smallest GPU tier, VRAM in GB, CPU tier, RAM in GB that reach this target. */
  gpuTier: number;
  vram: number;
  cpuTier: number;
  ram: number;
  /** Plain-words examples shown in the targets table. */
  gpuExamples: string;
  cpuExamples: string;
}

export const TARGETS: readonly Target[] = [
  {
    level: 1,
    id: "rdr2-min",
    name: "RDR2 minimum",
    estimate: false,
    gpuTier: 2,
    vram: 2,
    cpuTier: 2,
    ram: 8,
    gpuExamples: "GeForce GTX 770 2 GB or Radeon R9 280 3 GB",
    cpuExamples: "Core i5-2500K or FX-6300",
  },
  {
    level: 2,
    id: "rdr2-rec",
    name: "RDR2 recommended",
    estimate: false,
    gpuTier: 4,
    vram: 4,
    cpuTier: 4,
    ram: 12,
    gpuExamples: "GeForce GTX 1060 6 GB or Radeon RX 480 4 GB",
    cpuExamples: "Core i7-4770K or Ryzen 5 1500X",
  },
  {
    level: 3,
    id: "ps5",
    name: "PS5-class (our estimate)",
    estimate: true,
    gpuTier: 7,
    vram: 8,
    cpuTier: 6,
    ram: 16,
    gpuExamples: "GeForce RTX 2070 Super or Radeon RX 6700 and up",
    cpuExamples: "Ryzen 5 3600 or Core i5-10400F and up",
  },
];

export const MIAMI_SOURCES = {
  rdr2Specs: { name: "Rockstar's RDR2 PC requirements", href: "https://support.rockstargames.com/articles/1LqwiYbHeiSyo3dtcVyS1N/red-dead-redemption-2-pc-system-requirements" },
  rdr2Proton: { name: "RDR2 on ProtonDB", href: "https://www.protondb.com/app/1174180" },
  /** Proton's open-source Direct3D-to-Vulkan layers: legitimate projects, unrelated to any leak. */
  dxvk: { name: "DXVK", href: "https://github.com/doitsujin/dxvk" },
  vkd3d: { name: "VKD3D-Proton", href: "https://github.com/HansKristian-Work/vkd3d-proton" },
} as const;

/** RDR2 on ProtonDB when we last looked (the public summary API, 2026-11-24). */
export const RDR2_PROTON = { tier: "Gold", trending: "Platinum", reports: 1474, checked: "2026-11-24" } as const;

export const MIAMI_DISCLAIMER =
  "Not affiliated with Rockstar Games or Take-Two Interactive. Grand Theft Auto and GTA are trademarks of Take-Two Interactive Software, Inc.; we use the name only to say which game this page is about.";

/** Names of consoles and hardware the page mentions. */
export const MIAMI_MARKS_NOTE =
  "PlayStation, Xbox, NVIDIA, GeForce, AMD, Radeon, Intel, Arc, Ryzen, Core and other product names belong to their owners. We use them only to identify the products.";

export const MIAMI_STORAGE_NOTE = "RDR2 asks for 150 GB of free space; GTA VI's size is unknown. Plan for an SSD with room to spare.";

export const MIAMI_RAM_LINUX = "On Linux, aim for 16 GB or more: Proton compiles shaders as you play, and the desktop uses memory too.";

export const MIAMI_ONLINE_NOTE =
  "GTA Online's anti-cheat on Linux is unknown, because no PC version exists. Online games often block Linux; look up the game on AreWeAntiCheatYet and ProtonDB once it ships.";

export const LEVEL_LABEL: Record<Level, string> = {
  0: "Below the RDR2 minimum",
  1: "Meets the RDR2 minimum",
  2: "Meets the RDR2 recommended spec",
  3: "PS5-class or better",
};

export const LEVEL_SUMMARY: Record<Level, string> = {
  0: "If GTA VI follows RDR2's lead, this PC would not get it running.",
  1: "This PC would scrape by on RDR2's lowest settings. GTA VI is a newer game and will likely ask for more.",
  2: "A fair start: this matches what RDR2 recommends. Expect GTA VI to want more.",
  3: "This PC matches or beats the hardware GTA VI is built around today, our best guess for a PC target.",
};
