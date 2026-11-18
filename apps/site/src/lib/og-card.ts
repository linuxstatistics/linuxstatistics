import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { BRAND, brandMarkDataUri } from "@linux-statistics/shared";

const require = createRequire(import.meta.url);
const font = (w: 400 | 700 | 800) => readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff`));

type El = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown): El => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

/** 1200×630 default share image: mark, wordmark, tagline and two site facts. */
export async function renderOgCard(o: { tracked: number; sharePct: number | null; siteHost: string }): Promise<Buffer> {
  const facts = [`${o.tracked} distros tracked`];
  if (o.sharePct != null) facts.push(`Linux desktop share ${o.sharePct.toFixed(2)}%`);
  const tree = h(
    "div",
    { width: 1200, height: 630, boxSizing: "border-box", background: BRAND.ink, color: BRAND.paper, flexDirection: "column", justifyContent: "center", padding: "64px 80px", fontFamily: "Inter", position: "relative" },
    [
      h("div", { alignItems: "center", gap: 28 }, [
        { type: "img", props: { src: brandMarkDataUri(), width: 120, height: 120 } },
        h("div", { fontSize: 104, fontWeight: 800, letterSpacing: -5, lineHeight: 1 }, [
          h("span", {}, "linux"),
          h("span", { color: BRAND.neon }, "stats"),
        ]),
      ]),
      h("div", { fontSize: 40, marginTop: 36, maxWidth: 980, lineHeight: 1.25 }, "Every Linux distro, ranked by what people actually look at."),
      h("div", { position: "absolute", left: 80, right: 80, bottom: 56, justifyContent: "space-between", fontSize: 26, color: BRAND.muted }, [
        h("div", {}, facts.join("  ·  ")),
        h("div", { color: BRAND.neon }, o.siteHost),
      ]),
    ],
  );
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Inter", data: font(400), weight: 400, style: "normal" },
      { name: "Inter", data: font(800), weight: 800, style: "normal" },
    ],
  });
  return new Resvg(svg).render().asPng();
}

/** Title size that keeps up to four lines inside the card. */
export const titleSize = (title: string) => (title.length <= 40 ? 76 : title.length <= 70 ? 64 : title.length <= 95 ? 54 : 46);

/** 1200×630 share image for an article or topic hub: kicker, title, wordmark, host. */
export async function renderArticleCard(o: { kicker: string; title: string; siteHost: string }): Promise<Buffer> {
  const tree = h(
    "div",
    { width: 1200, height: 630, boxSizing: "border-box", background: BRAND.ink, color: BRAND.paper, flexDirection: "column", padding: "64px 80px", fontFamily: "Inter", position: "relative" },
    [
      h("div", { fontSize: 28, fontWeight: 700, color: BRAND.neon, letterSpacing: 2, textTransform: "uppercase" }, o.kicker),
      h("div", { fontSize: titleSize(o.title), fontWeight: 800, letterSpacing: -2, lineHeight: 1.08, marginTop: 28, maxWidth: 1040 }, o.title),
      h("div", { position: "absolute", left: 80, right: 80, bottom: 56, alignItems: "center", justifyContent: "space-between", fontSize: 26, color: BRAND.muted }, [
        h("div", { alignItems: "center", gap: 16 }, [
          { type: "img", props: { src: brandMarkDataUri(), width: 52, height: 52 } },
          h("div", { fontSize: 40, fontWeight: 800, letterSpacing: -2, color: BRAND.paper }, [h("span", {}, "linux"), h("span", { color: BRAND.neon }, "stats")]),
        ]),
        h("div", { color: BRAND.neon }, o.siteHost),
      ]),
    ],
  );
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Inter", data: font(400), weight: 400, style: "normal" },
      { name: "Inter", data: font(700), weight: 700, style: "normal" },
      { name: "Inter", data: font(800), weight: 800, style: "normal" },
    ],
  });
  return new Resvg(svg).render().asPng();
}
