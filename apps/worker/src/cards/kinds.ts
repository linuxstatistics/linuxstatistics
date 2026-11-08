import type { DistroListItem, MarketSharePoint } from "@linux-statistics/shared";
import { BRAND } from "@linux-statistics/shared";
import { barRow, frame, h, type El, type Size } from "./render.js";

export const KINDS = ["top", "movers", "share", "stat"] as const;
export type Kind = (typeof KINDS)[number];

export interface CardInput {
  size: Size;
  siteHost: string;
  /** Headline override; each kind has a default. */
  title?: string;
  /** Caption override (bottom-left); each kind has a sourced default. */
  caption?: string;
  /** Number of rows for list kinds (default 5 landscape, 8 square). */
  count?: number;
}

const monthLabel = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const rows = (i: CardInput) => i.count ?? (i.size === "square" ? 8 : 5);
const RANK_CREDIT = "Ranking: LinuxStatistics composite index. Interest, not installs.";

/** Top N by current rank. Rank positions only, never hit counts (export rule). */
export function topCard(list: DistroListItem[], i: CardInput, asOf: string): El {
  const top = list.filter((d) => d.rank != null).sort((a, b) => a.rank! - b.rank!).slice(0, rows(i));
  const fs = i.size === "square" ? 40 : 36;
  return frame({
    size: i.size,
    siteHost: i.siteHost,
    eyebrow: "Linux distro rankings",
    headline: i.title ?? monthLabel(asOf),
    caption: i.caption ?? RANK_CREDIT,
    body: top.map((d) =>
      h("div", { fontSize: fs, marginBottom: 10, alignItems: "baseline" }, [
        h("div", { width: 80, color: BRAND.muted }, `#${d.rank}`),
        h("div", { fontWeight: 700 }, d.name),
        d.rank1mDelta != null && d.rank1mDelta !== 0
          ? h("div", { marginLeft: 18, fontSize: fs - 8, color: d.rank1mDelta > 0 ? BRAND.neon : "#ff6b6b" }, `${d.rank1mDelta > 0 ? "+" : "-"}${Math.abs(d.rank1mDelta)}`)
          : h("div", {}, []),
      ]),
    ),
  });
}

/** Biggest climbers this month: 12-month rank → 1-month rank. */
export function moversCard(rising: DistroListItem[], i: CardInput, asOf: string): El {
  const top = rising.filter((d) => d.rank != null && d.rank1m != null && (d.rank1mDelta ?? 0) > 0).slice(0, rows(i));
  const fs = i.size === "square" ? 40 : 36;
  return frame({
    size: i.size,
    siteHost: i.siteHost,
    eyebrow: "Rising this month",
    headline: i.title ?? monthLabel(asOf),
    caption: i.caption ?? RANK_CREDIT,
    body: top.length
      ? top.map((d) =>
          h("div", { fontSize: fs, marginBottom: 10, alignItems: "baseline" }, [
            h("div", { width: 110, color: BRAND.neon, fontWeight: 700 }, `+${d.rank1mDelta}`),
            h("div", { fontWeight: 700 }, d.name),
            h("div", { marginLeft: 18, fontSize: fs - 8, color: BRAND.muted }, `#${d.rank} to #${d.rank1m}`),
          ]),
        )
      : [h("div", { fontSize: fs, color: BRAND.muted }, "No climbers this month.")],
  });
}

/** Linux desktop share over the last N months (StatCounter, worldwide). */
export function shareCard(points: MarketSharePoint[], i: CardInput): El {
  const linux = points.filter((p) => p.platform === "linux" && p.region === "global").sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const n = i.count ?? (i.size === "square" ? 10 : 6);
  const recent = linux.slice(-n);
  const last = recent[recent.length - 1];
  const max = Math.max(...recent.map((p) => p.sharePct), 0.01);
  return frame({
    size: i.size,
    siteHost: i.siteHost,
    eyebrow: "Linux desktop market share",
    headline: i.title ?? (last ? `${last.sharePct.toFixed(2)}% in ${monthLabel(last.capturedAt)}` : "No data yet"),
    caption: i.caption ?? "Source: StatCounter Global Stats, desktop, worldwide.",
    body: recent.map((p) => barRow(new Date(p.capturedAt).toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }), p.sharePct, max, `${p.sharePct.toFixed(2)}%`, BRAND.neon, i.size)),
  });
}

/** One big number with a line under it: for "545 distros tracked" style posts. */
export function statCard(o: { value: string; label: string; detail?: string }, i: CardInput): El {
  return frame({
    size: i.size,
    siteHost: i.siteHost,
    eyebrow: i.title ?? "LinuxStatistics",
    headline: o.value,
    headlineSize: i.size === "square" ? 200 : 140,
    caption: i.caption ?? "linuxstatistics.com, open data under CC BY 4.0.",
    body: [
      h("div", { fontSize: i.size === "square" ? 64 : 48, fontWeight: 700, lineHeight: 1.15 }, o.label),
      o.detail ? h("div", { fontSize: i.size === "square" ? 40 : 32, color: BRAND.muted, marginTop: 24, lineHeight: 1.3 }, o.detail) : h("div", {}, []),
    ],
  });
}
