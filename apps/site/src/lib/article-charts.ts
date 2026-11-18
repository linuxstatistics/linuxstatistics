/**
 * Charts an article places with one paragraph, e.g. `[chart: rank mint fedora]`.
 * Parsing and drawing are pure (tested); the article page loads the data and
 * swaps each chart paragraph for a static SVG figure. No client JS.
 */
export type ChartSpec =
  | { kind: "share" }
  | { kind: "rank"; slugs: string[] }
  | { kind: "rising" }
  | { kind: "top"; n: number };

/** A rank chart compares at most this many distros, to stay readable. */
export const MAX_RANK_DISTROS = 2;
const TOP_MAX = 15;

/** A chart line on its own paragraph: `[chart: ...]`. */
export const CHART_LINE = /^\[chart:\s*([^\]]*)\]$/i;
const PARA = /<p>\s*\[chart:\s*([^\]]*)\]\s*<\/p>/gi;

export function parseChart(body: string): ChartSpec | { error: string } {
  const [kind, ...rest] = body.trim().toLowerCase().split(/\s+/);
  if (kind === "share" && rest.length === 0) return { kind: "share" };
  if (kind === "rising" && rest.length === 0) return { kind: "rising" };
  if (kind === "top") {
    const n = rest.length ? Number(rest[0]) : 10;
    if (rest.length > 1 || !Number.isInteger(n) || n < 3 || n > TOP_MAX) return { error: `top takes a number from 3 to ${TOP_MAX}` };
    return { kind: "top", n };
  }
  if (kind === "rank") {
    if (rest.length < 1 || rest.length > MAX_RANK_DISTROS) return { error: `rank takes 1 or ${MAX_RANK_DISTROS} distro slugs` };
    if (rest.some((s) => !/^[a-z0-9-]+$/.test(s))) return { error: "distro slugs are lowercase letters, digits and dashes" };
    if (new Set(rest).size !== rest.length) return { error: "rank lists a distro twice" };
    return { kind: "rank", slugs: rest };
  }
  return { error: `unknown chart "${body.trim()}" (use share, rank <slug> [slug], rising, top [n])` };
}

/** Every chart paragraph in rendered HTML, parsed. */
export function findCharts(html: string): { raw: string; spec: ChartSpec | { error: string } }[] {
  return [...html.matchAll(PARA)].map((m) => ({ raw: m[1]!.trim(), spec: parseChart(m[1]!) }));
}

/** Chart lines in Markdown source (for article:check, which has no renderer). */
export function findChartLines(md: string): { line: number; raw: string; spec: ChartSpec | { error: string } }[] {
  const out: { line: number; raw: string; spec: ChartSpec | { error: string } }[] = [];
  md.split(/\r?\n/).forEach((l, i) => {
    const m = l.trim().match(CHART_LINE);
    if (m) out.push({ line: i + 1, raw: m[1]!.trim(), spec: parseChart(m[1]!) });
  });
  return out;
}

/** Replace each chart paragraph with `render(spec)`; throws on a bad chart so the build fails. */
export function replaceCharts(html: string, render: (spec: ChartSpec) => string, where = "article"): string {
  return html.replace(PARA, (_m, body: string) => {
    const spec = parseChart(body);
    if ("error" in spec) throw new Error(`${where}: [chart: ${body.trim()}]: ${spec.error}`);
    return render(spec);
  });
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface Caption {
  title: string;
  source: string;
  /** YYYY-MM-DD the data is from, when known. */
  asOf: string | null;
  link: { href: string; label: string };
}

/** A figure around an SVG. `label` states the finding for screen readers. */
export function figure(svg: string, label: string, c: Caption): string {
  const date = c.asOf ? `, data as of <time datetime="${c.asOf}">${c.asOf}</time>` : "";
  return `<figure class="article-chart"><div class="article-chart-svg" role="img" aria-label="${esc(label)}">${svg}</div><figcaption><strong>${esc(c.title)}.</strong> Source: ${esc(c.source)}${date}. <a href="${c.link.href}">${esc(c.link.label)}</a></figcaption></figure>`;
}

const W = 720;
const T = 16;
const B = 30;
const L = 46;
const R = 20;

export interface LinePoint {
  t: number; // fractional year
  value: number;
}

/** Line chart; `invert` puts small values at the top (ranks). */
export function lineSvg(series: { name: string; cls: string; points: LinePoint[] }[], o: { height?: number; invert?: boolean; unit?: string; max?: number; min?: number } = {}): string {
  const H = o.height ?? 260;
  const all = series.flatMap((s) => s.points);
  if (all.length < 2) return "";
  const t0 = Math.min(...all.map((p) => p.t));
  const t1 = Math.max(...all.map((p) => p.t));
  const vMin = o.min ?? Math.min(...all.map((p) => p.value));
  const vMax = o.max ?? Math.max(...all.map((p) => p.value));
  const span = vMax - vMin || 1;
  const x = (t: number) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R);
  const y = (v: number) => {
    const f = (v - vMin) / span;
    return T + (o.invert ? f : 1 - f) * (H - T - B);
  };
  // Ranks always show #1 at the top.
  const raw = o.invert ? [...new Set([1, ...niceTicks(vMin, vMax, 4).filter((v) => v > 1 && Number.isInteger(v))])] : niceTicks(vMin, vMax, 4);
  // Drop a tick that would sit on top of the one before it.
  const ticks = raw.filter((v, i) => i === 0 || Math.abs(y(v) - y(raw[i - 1]!)) >= 34);
  const unit = o.unit ?? "";
  const years: number[] = [];
  const step = Math.max(1, Math.ceil((Math.floor(t1) - Math.ceil(t0)) / 6));
  for (let yr = Math.ceil(t0); yr <= Math.floor(t1); yr += step) years.push(yr);
  const xLabels = t1 - t0 < 0.25 ? dayTicks(t0, t1) : t1 - t0 < 2 ? monthTicks(t0, t1) : years.map((yr) => ({ t: yr, label: String(yr) }));
  const parts: string[] = [`<svg class="stats-chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">`];
  for (const v of ticks) parts.push(`<line class="stats-gridline" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${o.invert ? "#" : ""}${fmtTick(v)}${unit}</text>`);
  xLabels.forEach((l, i) => {
    // Edge labels align inward so they never clip.
    const anchor = xLabels.length > 1 && i === 0 && x(l.t) - L < 30 ? "start" : xLabels.length > 1 && i === xLabels.length - 1 && W - R - x(l.t) < 30 ? "end" : "middle";
    parts.push(`<text x="${x(l.t).toFixed(1)}" y="${H - 8}" text-anchor="${anchor}">${l.label}</text>`);
  });
  for (const s of series) {
    if (s.points.length < 1) continue;
    const d = s.points.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
    const last = s.points[s.points.length - 1]!;
    parts.push(`<path class="stats-line ${s.cls}" d="${d}"/>`);
    parts.push(`<circle class="chart-dot ${s.cls}" cx="${x(last.t).toFixed(1)}" cy="${y(last.value).toFixed(1)}" r="4.5"/>`);
    parts.push(`<text class="stats-callout" x="${(x(last.t) - 8).toFixed(1)}" y="${(y(last.value) - 10).toFixed(1)}" text-anchor="end">${esc(s.name)} ${o.invert ? "#" : ""}${fmtTick(last.value)}${unit}</text>`);
  }
  parts.push("</svg>");
  return parts.join("");
}

/** Horizontal bars, one row per item, value printed at the end. */
export function barsSvg(items: { label: string; value: number; display: string }[], o: { highlight?: number } = {}): string {
  if (items.length === 0) return "";
  const row = 30;
  const labelW = 200;
  const valueW = 64;
  const H = items.length * row + 8;
  const max = Math.max(...items.map((i) => i.value), 1);
  const barMax = W - labelW - valueW - 16;
  const parts: string[] = [`<svg class="stats-chart chart-bars" viewBox="0 0 ${W} ${H}" aria-hidden="true">`];
  items.forEach((it, i) => {
    const yy = 4 + i * row;
    const w = Math.max(2, (it.value / max) * barMax);
    parts.push(`<text x="${labelW - 10}" y="${yy + 19}" text-anchor="end" class="chart-bar-label">${esc(it.label)}</text>`);
    parts.push(`<rect class="chart-bar${i === (o.highlight ?? -1) ? " is-lead" : ""}" x="${labelW}" y="${yy + 6}" width="${w.toFixed(1)}" height="18" rx="3"/>`);
    parts.push(`<text x="${(labelW + w + 8).toFixed(1)}" y="${yy + 19}">${esc(it.display)}</text>`);
  });
  parts.push("</svg>");
  return parts.join("");
}

function niceTicks(min: number, max: number, n: number): number[] {
  const span = max - min || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

const fmtTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(v < 10 ? 1 : 0));

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthTicks(t0: number, t1: number): { t: number; label: string }[] {
  const out: { t: number; label: string }[] = [];
  const start = Math.ceil(t0 * 12);
  const end = Math.floor(t1 * 12);
  const step = Math.max(1, Math.ceil((end - start) / 6));
  for (let m = start; m <= end; m += step) out.push({ t: m / 12, label: `${MON[m % 12]} ${String(Math.floor(m / 12)).slice(2)}` });
  return out;
}

/** Short spans (under 3 months): first, middle and last day. */
function dayTicks(t0: number, t1: number): { t: number; label: string }[] {
  const lab = (t: number) => {
    const yr = Math.floor(t);
    const d = new Date(Date.UTC(yr, 0, 1) + (t - yr) * 365.25 * 864e5);
    return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
  };
  return [t0, (t0 + t1) / 2, t1].map((t) => ({ t, label: lab(t) }));
}

/** ISO date to fractional year. */
export const fracYear = (iso: string) => {
  const d = new Date(iso);
  const yr = d.getUTCFullYear();
  return yr + (d.getTime() - Date.UTC(yr, 0, 1)) / (365.25 * 864e5);
};
