import * as cheerio from "cheerio";
import type { Period } from "@linux-statistics/shared";

export interface ParsedRanking {
  rank: number;
  /** DistroWatch's own distro key, from the row link (e.g. "cachyos"). */
  key: string;
  name: string;
  hitsPerDay: number;
  period: Period;
}

const HEADING_TO_PERIOD: Record<string, Period> = {
  "last 1 month": "last-1-month",
  "last 3 months": "last-3-months",
  "last 6 months": "last-6-months",
  "last 12 months": "last-12-months",
};

const MIN_ROWS_PER_PERIOD = 5;

/**
 * Parse the DistroWatch popularity page. It holds one table per period, each
 * headed by a row like `<th class="Invert">Last 12 months</th>`, followed by
 *   <tr><th class="phr1">1</th><td class="phr2"><a href="cachyos">CachyOS</a></td><td class="phr3">3248</td></tr>
 *
 * The parser validates shape and FAILS LOUDLY (throws) rather than returning
 * garbage, so a layout change never silently overwrites good data.
 */
export function parseDistrowatchRanking(html: string): ParsedRanking[] {
  const $ = cheerio.load(html);
  const out: ParsedRanking[] = [];
  const seenPeriods = new Set<Period>();

  $("table").each((_, table) => {
    const $table = $(table);
    // Ranking tables are leaves; skip outer layout tables that merely contain them.
    if ($table.find("table").length) return;
    const rows = $table.find("tr");
    if (!rows.children("th.phr1").length) return;

    const headingText = rows.children("th.Invert").first().text().trim().toLowerCase();
    if (!headingText) {
      throw new Error("DistroWatch ranking table has no period heading; the page layout may have changed");
    }
    const period = HEADING_TO_PERIOD[headingText];
    if (!period) throw new Error(`Unrecognised DistroWatch table heading "${headingText}"`);
    if (seenPeriods.has(period)) throw new Error(`DistroWatch page has two "${headingText}" tables`);
    seenPeriods.add(period);

    const ranks = new Set<number>();
    let count = 0;
    rows.each((__, tr) => {
      const $tr = $(tr);
      const th = $tr.children("th.phr1");
      if (!th.length) return;
      const rank = Number.parseInt(th.text().trim(), 10);
      const link = $tr.find("td.phr2 a").first();
      const name = link.text().trim();
      const key = (link.attr("href") ?? "").trim();
      const hitsPerDay = Number.parseInt($tr.find("td.phr3").first().text().replace(/[^0-9]/g, ""), 10);
      if (!Number.isInteger(rank) || rank <= 0 || !name || !Number.isInteger(hitsPerDay)) {
        throw new Error(`Malformed DistroWatch row in "${headingText}": ${$tr.text().trim().slice(0, 80)}`);
      }
      if (!/^[a-z0-9][a-z0-9_-]*$/i.test(key)) {
        throw new Error(`DistroWatch row "${name}" has no usable key (href="${key}")`);
      }
      if (ranks.has(rank)) throw new Error(`DistroWatch "${headingText}" has a duplicate rank ${rank}`);
      ranks.add(rank);
      out.push({ rank, key: key.toLowerCase(), name, hitsPerDay, period });
      count += 1;
    });
    if (count < MIN_ROWS_PER_PERIOD) {
      throw new Error(
        `DistroWatch "${headingText}" has only ${count} rows; the page layout may have changed`,
      );
    }
  });

  if (out.length === 0 || !seenPeriods.has("last-12-months")) {
    throw new Error(
      `DistroWatch parse produced ${out.length} rows and no 12-month table; the page layout may have changed`,
    );
  }
  return out;
}
