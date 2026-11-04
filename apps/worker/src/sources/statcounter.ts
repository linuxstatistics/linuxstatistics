export type Platform = "linux" | "windows" | "macos" | "other";

export interface ParsedShare {
  date: string; // as found in the CSV, e.g. "2025-01"
  platform: Platform;
  sharePct: number;
}

/** Desktop platforms we chart; everything else (Chrome OS, mobile OSes…) is "other". */
function mapPlatform(header: string): Platform | null {
  const h = header.toLowerCase();
  if (!h) return null;
  if (h.includes("linux")) return "linux";
  if (h.includes("win")) return "windows";
  if (h.includes("mac") || h.includes("os x") || h === "osx") return "macos";
  return "other";
}

const unquote = (s: string) => s.trim().replace(/^"(.*)"$/, "$1").trim();

/**
 * Parse a StatCounter GlobalStats CSV export, e.g.
 *   "Date","Windows","OS X","Linux","Chrome OS",...,"macOS",...
 * Columns that map to the same platform are summed (StatCounter still splits
 * "OS X" and "macOS"). Throws if there is no Date column, no platform column,
 * or no data rows, so an empty export never overwrites good data.
 */
export function parseStatcounterCsv(csv: string): ParsedShare[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("StatCounter CSV has no data rows");

  const header = lines[0]!.split(",").map(unquote);
  const dateIdx = header.findIndex((h) => h.toLowerCase() === "date");
  if (dateIdx === -1) throw new Error("StatCounter CSV missing Date column");

  const platformCols: { idx: number; platform: Platform }[] = [];
  header.forEach((h, i) => {
    if (i === dateIdx) return;
    const platform = mapPlatform(h);
    if (platform) platformCols.push({ idx: i, platform });
  });
  if (!platformCols.some((c) => c.platform !== "other") || platformCols.length === 0) {
    throw new Error("StatCounter CSV has no recognized platform columns");
  }

  const out: ParsedShare[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map(unquote);
    const date = cells[dateIdx];
    if (!date) continue;
    const sums = new Map<Platform, number>();
    for (const { idx, platform } of platformCols) {
      const value = Number.parseFloat(cells[idx] ?? "");
      if (Number.isFinite(value)) sums.set(platform, (sums.get(platform) ?? 0) + value);
    }
    for (const [platform, sharePct] of sums) {
      out.push({ date, platform, sharePct: Math.round(sharePct * 1000) / 1000 });
    }
  }
  if (out.length === 0) throw new Error("StatCounter CSV has no data rows");
  return out;
}

const REGION_PATHS: Record<string, { path: string; hidden: string; label: string }> = {
  ww: { path: "worldwide", hidden: "ww", label: "Worldwide" },
};

/** CSV export URL for desktop OS market share, monthly, "YYYY-MM" to "YYYY-MM". */
export function statcounterCsvUrl(region: keyof typeof REGION_PATHS, from: string, to: string): string {
  const r = REGION_PATHS[region];
  if (!r) throw new Error(`Unknown StatCounter region ${region}`);
  const u = new URL(`https://gs.statcounter.com/os-market-share/desktop/${r.path}/chart.php`);
  u.searchParams.set("device", "Desktop");
  u.searchParams.set("device_hidden", "desktop");
  u.searchParams.set("statType_hidden", "os_combined");
  u.searchParams.set("region_hidden", r.hidden);
  u.searchParams.set("granularity", "monthly");
  u.searchParams.set("statType", "Operating System");
  u.searchParams.set("region", r.label);
  u.searchParams.set("fromInt", from.replace("-", ""));
  u.searchParams.set("toInt", to.replace("-", ""));
  u.searchParams.set("fromMonthYear", from);
  u.searchParams.set("toMonthYear", to);
  u.searchParams.set("csv", "1");
  return u.toString();
}
