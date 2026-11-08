import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { brandMarkDataUri } from "@linux-statistics/shared";

const require = createRequire(import.meta.url);
const font = (w: 400 | 700) => readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff`));

type El = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown): El => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

/** 1200×630 PNG for shared quiz results: "Matched with <Distro>". */
export async function renderMatchCard(m: { name: string; blurb: string; rank: number | null }, siteHost: string): Promise<Buffer> {
  const tree = h(
    "div",
    { width: 1200, height: 630, boxSizing: "border-box", background: "#000", color: "#e9eef5", flexDirection: "column", padding: "64px", fontFamily: "Inter", position: "relative" },
    [
      h("div", { fontSize: 26, letterSpacing: 6, color: "#7d8794" }, "WHICH LINUX DISTRO SHOULD I USE?"),
      h("div", { fontSize: 40, marginTop: 40, color: "#7d8794" }, "Matched with"),
      h("div", { fontSize: 96, fontWeight: 700, marginTop: 4, color: "#3cfe3f" }, m.name),
      h("div", { fontSize: 32, marginTop: 24, maxWidth: 1000, lineHeight: 1.3 }, m.blurb),
      h("div", { position: "absolute", left: 64, right: 64, bottom: 56, justifyContent: "space-between", fontSize: 26, color: "#7d8794" }, [
        h("div", {}, "Take the quiz"),
        h("div", { alignItems: "center", gap: 14 }, [
          { type: "img", props: { src: brandMarkDataUri(), width: 40, height: 40 } },
          h("div", { color: "#3cfe3f" }, `${siteHost}/pick`),
        ]),
      ]),
    ],
  );
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Inter", data: font(400), weight: 400, style: "normal" },
      { name: "Inter", data: font(700), weight: 700, style: "normal" },
    ],
  });
  return new Resvg(svg).render().asPng();
}
