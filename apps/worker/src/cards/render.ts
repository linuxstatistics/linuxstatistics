import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { BRAND, brandMarkDataUri } from "@linux-statistics/shared";

const require = createRequire(import.meta.url);
const font = (w: 400 | 700) => readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff`));

export type El = { type: string; props: Record<string, unknown> & { children?: unknown } };
export const h = (type: string, style: Record<string, unknown>, children?: unknown): El => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

export const SIZES = { landscape: [1200, 630], square: [1080, 1080] } as const;
export type Size = keyof typeof SIZES;

/**
 * Brand frame around any card body: eyebrow, headline, body, footer with a
 * caption on the left and mark + host on the right.
 */
export function frame(o: { eyebrow: string; headline: string; body: El | El[]; caption: string; siteHost: string; size: Size; headlineColor?: string; headlineSize?: number }): El {
  const [w, hgt] = SIZES[o.size];
  const pad = o.size === "square" ? 72 : 64;
  return h(
    "div",
    { width: w, height: hgt, boxSizing: "border-box", background: BRAND.ink, color: BRAND.paper, flexDirection: "column", padding: `${pad - 8}px ${pad}px`, fontFamily: "Inter", position: "relative" },
    [
      h("div", { fontSize: 26, letterSpacing: 6, color: BRAND.muted }, o.eyebrow.toUpperCase()),
      h("div", { fontSize: o.headlineSize ?? (o.size === "square" ? 72 : 64), fontWeight: 700, marginTop: 8, color: o.headlineColor ?? BRAND.neon, lineHeight: 1.05 }, o.headline),
      h("div", { flexDirection: "column", marginTop: 32, flex: 1, paddingBottom: 72, overflow: "hidden" }, o.body),
      h("div", { position: "absolute", left: pad, right: pad, bottom: pad - 16, justifyContent: "space-between", alignItems: "center", fontSize: 26, color: BRAND.muted }, [
        h("div", {}, o.caption),
        h("div", { alignItems: "center", gap: 14 }, [
          { type: "img", props: { src: brandMarkDataUri(), width: 40, height: 40 } },
          h("div", { color: BRAND.neon }, o.siteHost),
        ]),
      ]),
    ],
  );
}

export async function toPng(tree: El, size: Size): Promise<Buffer> {
  const [width, height] = SIZES[size];
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width,
    height,
    fonts: [
      { name: "Inter", data: font(400), weight: 400, style: "normal" },
      { name: "Inter", data: font(700), weight: 700, style: "normal" },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
}

/** A horizontal bar row: label, bar scaled to `max`, value text. */
export function barRow(label: string, value: number, max: number, valueText: string, color = BRAND.neon, size: Size = "landscape"): El {
  const fs = size === "square" ? 34 : 30;
  const pct = max > 0 ? Math.max(0.02, value / max) : 0;
  return h("div", { alignItems: "center", gap: 18, marginBottom: 14, fontSize: fs }, [
    h("div", { width: size === "square" ? 300 : 260, fontWeight: 700, overflow: "hidden" }, label),
    h("div", { flex: 1, height: fs, background: "#15171c", borderRadius: 6, overflow: "hidden" }, [h("div", { width: `${Math.round(pct * 100)}%`, height: "100%", background: color, borderRadius: 6 }, [])]),
    h("div", { width: 140, justifyContent: "flex-end", color: BRAND.muted }, valueText),
  ]);
}
