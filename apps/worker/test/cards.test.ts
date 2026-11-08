import { expect, test } from "vitest";
import type { DistroListItem, MarketSharePoint } from "@linux-statistics/shared";
import { moversCard, shareCard, statCard, topCard } from "../src/cards/kinds.js";
import { toPng } from "../src/cards/render.js";

const d = (slug: string, rank: number, rank1m: number | null = null, hits = 1234): DistroListItem =>
  ({ slug, name: slug.toUpperCase(), family: "debian", status: "active", rank, hitsPerDay: hits, stars: null, commitsLast30d: null, firstReleaseYear: null, repoFullName: null, rankTrend: null, rank1m, rank1mDelta: rank1m == null ? null : rank - rank1m }) as unknown as DistroListItem;

const png = (b: Buffer) => b.subarray(1, 4).toString() === "PNG";
const texts = (el: unknown): string[] => {
  const out: string[] = [];
  const walk = (n: unknown) => {
    if (typeof n === "string") out.push(n);
    else if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object" && "props" in n) walk((n as { props: { children?: unknown } }).props.children);
  };
  walk(el);
  return out;
};

test("top card lists rank positions only, never hit counts", async () => {
  const tree = topCard([d("mint", 1, 1), d("arch", 2, 5), d("deb", 3, 2)], { size: "landscape", siteHost: "x.test" }, "2026-11-08T00:00:00Z");
  const t = texts(tree).join(" ");
  expect(t).toContain("#1");
  expect(t).toContain("MINT");
  expect(t).toContain("-3");
  expect(t).toContain("+1");
  expect(t).not.toContain("1234");
  expect(png(await toPng(tree, "landscape"))).toBe(true);
});

test("movers card shows climb and both ranks", () => {
  const t = texts(moversCard([d("nix", 40, 10), d("flat", 5, 9)], { size: "square", siteHost: "x.test" }, "2026-11-08T00:00:00Z")).join(" ");
  expect(t).toContain("+30");
  expect(t).toContain("#40 to #10");
  expect(t).not.toContain("FLAT");
});

test("share card headlines the latest month and uses --count", () => {
  const pts: MarketSharePoint[] = [1, 2, 3].map((m) => ({ capturedAt: `2026-0${m}-01T00:00:00Z`, region: "global", platform: "linux", sharePct: m }));
  const t = texts(shareCard(pts, { size: "landscape", siteHost: "x.test", count: 2 })).join(" ");
  expect(t).toContain("3.00% in March 2026");
  expect(t).toContain("Feb 26");
  expect(t).not.toContain("Jan 26");
});

test("stat card renders a square PNG", async () => {
  const tree = statCard({ value: "545", label: "distros tracked" }, { size: "square", siteHost: "x.test" });
  expect(texts(tree).join(" ")).toContain("545");
  expect(png(await toPng(tree, "square"))).toBe(true);
});
