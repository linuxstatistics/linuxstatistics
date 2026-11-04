export type Platform = "linux" | "windows" | "macos" | "other";

export interface ParsedShare {
  date: string; // as found in the CSV, e.g. "2025-01"
  platform: Platform;
  sharePct: number;
}

function mapPlatform(header: string): Platform | null {
  const h = header.toLowerCase();
  if (h.includes("linux")) return "linux";
  if (h.includes("win")) return "windows";
  if (h.includes("mac") || h.includes("os x") || h === "osx") return "macos";
  return null;
}

/**
 * Parse a StatCounter GlobalStats CSV export. Expected header:
 *   Date,Windows,macOS,Linux,...
 * Throws if the CSV has no Date column or no recognized platform columns.
 */
export function parseStatcounterCsv(csv: string): ParsedShare[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("StatCounter CSV has no data rows");

  const header = lines[0]!.split(",").map((h) => h.trim());
  const dateIdx = header.findIndex((h) => h.toLowerCase() === "date");
  if (dateIdx === -1) throw new Error("StatCounter CSV missing Date column");

  const platformCols: { idx: number; platform: Platform }[] = [];
  header.forEach((h, i) => {
    if (i === dateIdx) return;
    const platform = mapPlatform(h);
    if (platform) platformCols.push({ idx: i, platform });
  });
  if (platformCols.length === 0) {
    throw new Error("StatCounter CSV has no recognized platform columns");
  }

  const out: ParsedShare[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const date = cells[dateIdx]?.trim();
    if (!date) continue;
    for (const { idx, platform } of platformCols) {
      const value = Number.parseFloat(cells[idx] ?? "");
      if (Number.isFinite(value)) out.push({ date, platform, sharePct: value });
    }
  }
  return out;
}
