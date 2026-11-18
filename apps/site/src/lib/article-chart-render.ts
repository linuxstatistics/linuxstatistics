import { RANK_SOURCE, RANK_VALUE_LABEL } from "@linux-statistics/shared";
import { barsSvg, figure, findCharts, fracYear, lineSvg, replaceCharts, type ChartSpec } from "./article-charts";
import { indexDate, loadDistro, loadDistros, loadMarketShare, loadMeta, loadRising } from "./data";
import { shareSeries } from "./stats";

const INDEX_SOURCE = "our composite index (interest, not installs)";

/** Swap every `[chart: ...]` paragraph for a figure built from build-time data. Bad charts fail the build. */
export async function renderArticleCharts(html: string, where: string): Promise<string> {
  const found = findCharts(html);
  if (found.length === 0) return html;
  for (const f of found) if ("error" in f.spec) throw new Error(`${where}: [chart: ${f.raw}]: ${f.spec.error}`);
  const specs = found.map((f) => f.spec as ChartSpec);
  const meta = await loadMeta();
  const builtOn = indexDate(meta);
  const need = new Set(specs.map((s) => s.kind));
  const share = need.has("share") ? await loadMarketShare() : [];
  const list = need.has("top") ? await loadDistros() : [];
  const rising = need.has("rising") ? await loadRising() : [];
  const slugs = [...new Set(specs.flatMap((s) => (s.kind === "rank" ? s.slugs : [])))];
  const details = new Map(
    await Promise.all(
      slugs.map(async (s) => {
        try {
          return [s, await loadDistro(s)] as const;
        } catch {
          throw new Error(`${where}: [chart: rank ...]: no distro "${s}" (use the slug from /distro/<slug>/)`);
        }
      }),
    ),
  );

  // Thin data leaves the chart out (the build still passes) and says so, so a missing chart is never silent.
  const skip = (chart: string, why: string) => {
    console.warn(`[article-charts] ${where}: [chart: ${chart}] left out: ${why}`);
    return "";
  };
  return replaceCharts(html, (spec) => {
    if (spec.kind === "share") {
      const s = shareSeries(share);
      const last = s.linux[s.linux.length - 1];
      const first = s.linux[0];
      if (!last || !first) return skip("share", "no market-share data");
      const svg = lineSvg(
        [
          { name: "macOS", cls: "os-macos", points: s.macos },
          { name: "Linux", cls: "os-linux", points: s.linux },
        ],
        { unit: "%", min: 0, max: Math.max(20, ...s.macos.map((p) => p.value)) },
      );
      const lastMonth = share.filter((p) => p.platform === "linux").map((p) => p.capturedAt).sort().at(-1)?.slice(0, 10) ?? null;
      return figure(svg, `Linux desktop share went from ${first.value}% in ${Math.floor(first.t)} to ${last.value}% in the latest month.`, {
        title: "Linux and macOS share of desktop computers, worldwide",
        source: "StatCounter Global Stats",
        asOf: lastMonth,
        link: { href: "/stats/", label: "Linux by the numbers" },
      });
    }
    if (spec.kind === "rank") {
      const ds = spec.slugs.map((s) => details.get(s)!);
      const series = ds.map((d, i) => ({ name: d.name, cls: i === 0 ? "os-linux" : "os-macos", points: d.rankHistory.map((p) => ({ t: fracYear(p.capturedAt), value: p.value })) }));
      const all = series.flatMap((s) => s.points.map((p) => p.value));
      if (series.some((s) => s.points.length < 2)) return skip(`rank ${spec.slugs.join(" ")}`, "needs at least 2 index captures per distro");
      const svg = lineSvg(series, { invert: true, min: 1, max: Math.max(...all) + 1 });
      const now = ds.map((d) => `${d.name} is #${d.rankHistory.at(-1)?.value ?? "?"}`).join(", ");
      const title = ds.length === 1 ? `${ds[0]!.name}'s rank on our index over time` : `${ds[0]!.name} and ${ds[1]!.name} on our index over time`;
      const link = ds.length === 1 ? { href: `/distro/${ds[0]!.slug}/`, label: `${ds[0]!.name} details` } : { href: `/compare/?a=${encodeURIComponent(spec.slugs[0]!)}&b=${encodeURIComponent(spec.slugs[1]!)}`, label: `Compare ${ds[0]!.name} and ${ds[1]!.name}` };
      return figure(svg, `Rank over time, lower is more interest. Now ${now}.`, { title, source: INDEX_SOURCE, asOf: builtOn, link });
    }
    if (spec.kind === "rising") {
      const top = rising.filter((d) => (d.rank1mDelta ?? 0) > 0).slice(0, 8);
      if (!top.length) return skip("rising", "no distro is rising this month");
      const svg = barsSvg(top.map((d) => ({ label: d.name, value: d.rank1mDelta!, display: `+${d.rank1mDelta}` })), { highlight: 0 });
      return figure(svg, `Biggest climbers this month: ${top[0]!.name} leads, up ${top[0]!.rank1mDelta} places.`, {
        title: "Places gained this month vs the 12-month ranking",
        source: INDEX_SOURCE,
        asOf: builtOn,
        link: { href: "/rising/", label: "All rising distros" },
      });
    }
    const top = list.filter((d) => d.rank != null).sort((a, b) => a.rank! - b.rank!).slice(0, spec.n);
    if (!top.length) return skip(`top ${spec.n}`, "no ranked distros");
    const svg = barsSvg(top.map((d) => ({ label: `${d.rank}. ${d.name}`, value: d.hitsPerDay ?? 0, display: (d.hitsPerDay ?? 0).toLocaleString("en-US") })), { highlight: 0 });
    return figure(svg, `Top ${top.length} by ${RANK_VALUE_LABEL[RANK_SOURCE].toLowerCase()}: ${top.slice(0, 3).map((d) => d.name).join(", ")} lead.`, {
      title: `Top ${top.length} Linux distros by ${RANK_VALUE_LABEL[RANK_SOURCE].toLowerCase()}`,
      source: INDEX_SOURCE,
      asOf: builtOn,
      link: { href: "/", label: "Full rankings" },
    });
  }, where);
}
