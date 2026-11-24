import { describe, expect, test } from "vitest";
import { CPUS, GPUS, RAM_OPTIONS, cpuById, gpuById } from "../src/lib/hardware-tiers";
import { MIAMI_REVIEWED, TARGETS } from "../src/lib/miami-targets";
import { check, gpuLevel, parsePicks, picksHash } from "../src/lib/miami-check";

const gpu = (name: string) => GPUS.find((g) => g.name === name)!.id;
const cpu = (name: string) => CPUS.find((c) => c.name === name)!.id;

describe("hardware table", () => {
  test("ids are unique and tiers are 1 to 9", () => {
    for (const list of [GPUS, CPUS]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
      for (const x of list) expect(x.tier).toBeGreaterThanOrEqual(1), expect(x.tier).toBeLessThanOrEqual(9);
    }
  });

  test("RDR2's own named parts sit at the tiers the targets use", () => {
    const [min, rec] = TARGETS;
    expect(gpuById(gpu("GTX 770 2 GB"))!.tier).toBe(min!.gpuTier);
    expect(gpuById(gpu("R9 280 3 GB"))!.tier).toBe(min!.gpuTier);
    expect(cpuById(cpu("Core i5-2500K"))!.tier).toBe(min!.cpuTier);
    expect(cpuById(cpu("FX-6300"))!.tier).toBe(min!.cpuTier);
    expect(gpuById(gpu("GTX 1060 6 GB"))!.tier).toBe(rec!.gpuTier);
    expect(gpuById(gpu("RX 480 4 GB"))!.tier).toBe(rec!.gpuTier);
    expect(cpuById(cpu("Core i7-4770K"))!.tier).toBe(rec!.cpuTier);
    expect(cpuById(cpu("Ryzen 5 1500X"))!.tier).toBe(rec!.cpuTier);
  });

  test("targets rise with the level and the review date is a date", () => {
    for (const key of ["gpuTier", "vram", "cpuTier", "ram"] as const) {
      expect(TARGETS[0]![key]).toBeLessThan(TARGETS[1]![key]);
      expect(TARGETS[1]![key]).toBeLessThan(TARGETS[2]![key]);
    }
    expect(MIAMI_REVIEWED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("RAM options are sorted", () => {
    expect([...RAM_OPTIONS]).toEqual([...RAM_OPTIONS].sort((a, b) => a - b));
  });
});

describe("check", () => {
  test("no verdict until all three parts are chosen", () => {
    expect(check({ gpu: null, cpu: cpu("Ryzen 5 5600X"), ram: 16 })).toBeNull();
    expect(check({ gpu: gpu("RTX 3060 12 GB"), cpu: null, ram: 16 })).toBeNull();
    expect(check({ gpu: gpu("RTX 3060 12 GB"), cpu: cpu("Ryzen 5 5600X"), ram: null })).toBeNull();
    expect(check({ gpu: "nope", cpu: cpu("Ryzen 5 5600X"), ram: 16 })).toBeNull();
    expect(check({ gpu: gpu("RTX 3060 12 GB"), cpu: cpu("Ryzen 5 5600X"), ram: 17 })).toBeNull();
  });

  test("a PS5-class PC reaches level 3 with nothing to fix", () => {
    const v = check({ gpu: gpu("RTX 4070 12 GB"), cpu: cpu("Ryzen 5 5600X"), ram: 32 })!;
    expect(v.level).toBe(3);
    expect(v.weakest).toBeNull();
    expect(v.nextStep).toBeNull();
  });

  test("the lowest part sets the level and is named", () => {
    const v = check({ gpu: gpu("RTX 4070 12 GB"), cpu: cpu("Core i5-2500K"), ram: 32 })!;
    expect(v.level).toBe(1);
    expect(v.weakest!.part).toBe("cpu");
    expect(v.nextStep).toContain("processor");
    expect(v.nextStep).toContain("RDR2 recommended");
  });

  test("RDR2 minimum hardware lands exactly on level 1, recommended on level 2", () => {
    expect(check({ gpu: gpu("GTX 770 2 GB"), cpu: cpu("Core i5-2500K"), ram: 8 })!.level).toBe(1);
    expect(check({ gpu: gpu("GTX 1060 6 GB"), cpu: cpu("Core i7-4770K"), ram: 12 })!.level).toBe(2);
  });

  test("below the minimum is level 0", () => {
    const v = check({ gpu: gpu("GT 1030 2 GB"), cpu: cpu("Ryzen 5 5600X"), ram: 16 })!;
    expect(v.level).toBe(0);
    expect(v.weakest!.part).toBe("gpu");
    expect(check({ gpu: gpu("RTX 4070 12 GB"), cpu: cpu("Ryzen 5 5600X"), ram: 4 })!.level).toBe(0);
  });

  test("too little video memory holds a fast card back", () => {
    // RX 6600 is tier 6 (level 2 by tier alone) with 8 GB: fine. RX 6400 has 4 GB and tier 3.
    expect(check({ gpu: gpu("RX 6400 4 GB"), cpu: cpu("Ryzen 5 5600X"), ram: 16 })!.parts[0]!.level).toBe(1);
  });

  test("video memory alone can cap an otherwise fast card", () => {
    const fast = { id: "x", name: "Test card", group: "NVIDIA GeForce", tier: 9, vram: 16, shared: false, linux: "ok" } as const;
    expect(gpuLevel(fast)).toBe(3);
    expect(gpuLevel({ ...fast, vram: 6 })).toBe(2); // tier says PS5-class, 6 GB only meets the recommended 4 GB
    expect(gpuLevel({ ...fast, vram: 3 })).toBe(1);
    expect(gpuLevel({ ...fast, vram: 1 })).toBe(0);
    expect(gpuLevel({ ...fast, tier: 3, vram: 16 })).toBe(1); // and a weak tier caps a big-memory card
  });

  test("Linux lines follow the card", () => {
    const ok = check({ gpu: gpu("RX 6600 8 GB"), cpu: cpu("Ryzen 5 5600X"), ram: 16 })!;
    expect(ok.linux.join(" ")).toMatch(/Mesa/);
    const legacy = check({ gpu: gpu("GTX 1060 6 GB"), cpu: cpu("Core i7-4770K"), ram: 16 })!;
    expect(legacy.linux.join(" ")).toMatch(/580/);
    const dead = check({ gpu: gpu("GTX 770 2 GB"), cpu: cpu("Core i5-2500K"), ram: 8 })!;
    expect(dead.linux.join(" ")).toMatch(/too old for Proton/);
    expect(dead.linux.join(" ")).toMatch(/below the 16 GB/);
  });
});

describe("share link", () => {
  test("round trip, and bad values drop out", () => {
    const p = { gpu: gpu("RTX 3060 12 GB"), cpu: cpu("Ryzen 5 5600X"), ram: 16 };
    expect(parsePicks(picksHash(p))).toEqual(p);
    expect(parsePicks("#gpu=bogus&cpu=bogus&ram=17")).toEqual({ gpu: null, cpu: null, ram: null });
    expect(picksHash({ gpu: null, cpu: null, ram: null })).toBe("");
  });
});
