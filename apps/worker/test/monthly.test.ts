import { expect, test } from "vitest";
import type { DistroListItem, MarketSharePoint } from "@linux-statistics/shared";
import { buildSummary, summaryEmailHtml, summaryMarkdown } from "../src/monthly/summary.js";
import { renderCard } from "../src/monthly/card.js";
import { createBroadcastDraft } from "../src/monthly/resend.js";

const d = (slug: string, rank: number | null, rank1m: number | null): DistroListItem => ({
  slug, name: slug.toUpperCase(), family: "other", status: "active", rank, hitsPerDay: rank ? 1000 - rank : null,
  stars: null, commitsLast30d: null, firstReleaseYear: null, repoFullName: null, rankTrend: null,
  rank1m, rank1mDelta: rank != null && rank1m != null ? rank - rank1m : null,
  userRating: { average: null, count: 0, mean: null, verifiedCount: 0 }, usesItCount: 0,
});
const list = [d("a", 1, 1), d("b", 2, 5), d("c", 3, 2), d("x<y", 4, 3), d("z", null, null)];
const share: MarketSharePoint[] = [
  { capturedAt: "2026-09-01T00:00:00.000Z", region: "global", platform: "linux", sharePct: 4.54 },
  { capturedAt: "2026-10-01T00:00:00.000Z", region: "global", platform: "linux", sharePct: 5.66 },
];
const s = buildSummary(list, [list[2]!, list[3]!], share, new Date("2026-11-03T00:30:00Z"));

test("summary: top list, risers, fallers and share change", () => {
  expect(s.month).toBe("November 2026");
  expect(s.top10.map((x) => x.slug)).toEqual(["a", "b", "c", "x<y"]);
  expect(s.rising[0]).toMatchObject({ slug: "c", climb: 1 });
  expect(s.falling).toEqual([{ name: "B", slug: "b", rank: 2, rank1m: 5, drop: 3 }]);
  expect(s.linuxShare).toEqual({ month: "October 2026", pct: 5.66, changePts: 1.12 });
});

test("markdown and email carry the data; email escapes names and has an unsubscribe link", () => {
  const md = summaryMarkdown(s, "https://linuxstatistics.com");
  expect(md).toContain("1. A\n");
  expect(md).not.toContain("hits/day");
  expect(md).toContain("B: #2 → #5 (▼3)");
  const html = summaryEmailHtml(s, "https://linuxstatistics.com");
  expect(html).toContain("X&lt;Y");
  expect(html).not.toContain("X<Y");
  expect(html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
});

test("share card renders a 1200x630 PNG", async () => {
  const png = await renderCard(s, "linuxstatistics.com");
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test("Resend draft: posts without a send flag and returns the id", async () => {
  let body: Record<string, unknown> = {};
  const id = await createBroadcastDraft(
    { segmentId: "seg", from: "LS <hi@example.com>", subject: "S", html: "<p>h</p>", text: "t", name: "n" },
    "re_test",
    async (_url, init) => {
      body = JSON.parse(String(init?.body));
      return Response.json({ object: "broadcast", id: "b1" });
    },
  );
  expect(id).toBe("b1");
  expect(body.segment_id).toBe("seg");
  expect("send" in body).toBe(false);
});

test("share change is only shown between consecutive months", () => {
  const yearly: MarketSharePoint[] = [
    { capturedAt: "2025-01-01T00:00:00.000Z", region: "global", platform: "linux", sharePct: 4.0 },
    { capturedAt: "2026-01-01T00:00:00.000Z", region: "global", platform: "linux", sharePct: 4.54 },
  ];
  expect(buildSummary(list, [], yearly, new Date("2026-11-03T00:30:00Z")).linuxShare).toEqual({
    month: "January 2026",
    pct: 4.54,
    changePts: null,
  });
});
