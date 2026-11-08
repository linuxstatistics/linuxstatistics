import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { brandMarkDataUri } from "@linux-statistics/shared";
import type { MonthlySummary } from "./summary.js";

const require = createRequire(import.meta.url);
const font = (w: 400 | 700) =>
  readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff`));

type El = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown): El => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

/** 1200×630 PNG share card: month, top 5 and the biggest climber. */
export async function renderCard(s: MonthlySummary, siteHost: string): Promise<Buffer> {
  const top = s.top10.slice(0, 5);
  const lead = s.rising[0];
  const tree = h(
    "div",
    { width: 1200, height: 630, boxSizing: "border-box", background: "#000", color: "#e9eef5", flexDirection: "column", padding: "56px 64px", fontFamily: "Inter", position: "relative" },
    [
      h("div", { fontSize: 26, letterSpacing: 6, color: "#7d8794" }, "LINUX DISTRO RANKINGS"),
      h("div", { fontSize: 64, fontWeight: 700, marginTop: 8, color: "#3cfe3f" }, s.month),
      h(
        "div",
        { flexDirection: "column", marginTop: 32 },
        top.map((d) =>
          h("div", { fontSize: 36, marginBottom: 10, alignItems: "baseline" }, [
            h("div", { width: 70, color: "#7d8794" }, `#${d.rank}`),
            h("div", { fontWeight: 700 }, d.name),
          ]),
        ),
      ),
      h("div", { position: "absolute", left: 64, right: 64, bottom: 48, justifyContent: "space-between", fontSize: 26, color: "#7d8794" }, [
        h("div", {}, lead ? `Rising this month: ${lead.name}, up ${lead.climb} places` : `${s.totalTracked} distros tracked`),
        h("div", { alignItems: "center", gap: 14 }, [
          { type: "img", props: { src: brandMarkDataUri(), width: 40, height: 40 } },
          h("div", { color: "#3cfe3f" }, siteHost),
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
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}
