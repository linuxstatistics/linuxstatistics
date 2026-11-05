import { expect, test } from "vitest";
import type { DistroListItem } from "@linux-statistics/shared";
import { orList, pairVerdict, reasonsFor } from "../src/lib/verdict";
import { faqJsonLd, pairFaq } from "../src/lib/faq";
import { NOTES } from "../src/lib/distro-notes";
import { PROFILES } from "../src/lib/picker-profiles";

const d = (slug: string, name: string, rank: number | null, extra: Partial<DistroListItem> & { basedOnSlug?: string | null } = {}) =>
  ({ slug, name, rank, family: "debian", hitsPerDay: 100, firstReleaseYear: 2000, ...extra }) as DistroListItem & { basedOnSlug?: string | null };

test("pair verdict drops shared reasons and keeps what differs", () => {
  const v = pairVerdict(d("mint", "Mint", 2), d("arch", "Arch", 13, { family: "arch" }))!;
  expect(v.a.reasons).toContain("you're new to Linux");
  expect(v.a.reasons).toContain("you prefer tested updates on a fixed schedule");
  expect(v.b.reasons).toEqual(expect.arrayContaining(["you want full control and don't mind the terminal", "you write software"]));
  // both "everyday": not a reason, so never shown
  expect([...v.a.reasons, ...v.b.reasons].join()).not.toMatch(/everyday/);
});

test("distros without a profile fall back to base and popularity", () => {
  const r = reasonsFor(d("someos", "SomeOS", 12, { basedOnSlug: "ubuntu" }), "Ubuntu").map((x) => x.text);
  expect(r).toEqual(["you like Ubuntu but want a different take on it", "you want a widely used distro with plenty of help online"]);
});

test("orList joins clauses", () => {
  expect(orList(["a"])).toBe("a");
  expect(orList(["a", "b", "c"])).toBe("a, b or c");
});

test("FAQ answers only what the data supports", () => {
  const faq = pairFaq(d("mint", "Mint", 2, { basedOnSlug: "ubuntu" }), d("ubuntu", "Ubuntu", 9));
  const qs = faq.map((x) => x.q);
  expect(qs[0]).toBe("Is Mint or Ubuntu more popular?");
  expect(faq[0]!.a).toContain("#2 vs #9");
  expect(qs).toContain("Is Mint based on Ubuntu?");
  expect(qs.some((q) => q.includes("gaming"))).toBe(false);
  const g = pairFaq(d("cachyos", "CachyOS", 1, { family: "arch" }), d("debian", "Debian", 4));
  expect(g.map((x) => x.q)).toEqual(expect.arrayContaining(["Is CachyOS or Debian better for gaming?", "How do updates differ between CachyOS and Debian?"]));
  expect(faqJsonLd(g).mainEntity).toHaveLength(g.length);
});

test("every profiled distro has 3 pros and 3 cons, no em dashes", () => {
  const keys = new Set(NOTES.map((n) => n.key));
  for (const p of PROFILES) expect(keys.has(p.key), p.key).toBe(true);
  for (const n of NOTES) {
    expect(n.pros, n.key).toHaveLength(3);
    expect(n.cons, n.key).toHaveLength(3);
    expect([...n.pros, ...n.cons].join(" ")).not.toMatch(/[—–]/);
  }
});

test("telemetry entries are sourced, and the FAQ compares them", async () => {
  const { TELEMETRY } = await import("../src/lib/telemetry");
  for (const t of TELEMETRY) {
    expect(t.source, t.key).toMatch(/^https:\/\//);
    if (t.level === "counting") expect(t.turnOff, t.key).toBeTruthy();
  }
  const faq = pairFaq(d("mint", "Mint", 2), d("zorin", "Zorin", 6));
  const q = faq.find((x) => x.q.includes("telemetry"))!;
  expect(q.a).toContain("Mint: none.");
  expect(q.a).toContain("Zorin sends an anonymous count by default");
});
