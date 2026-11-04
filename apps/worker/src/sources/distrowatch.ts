import * as cheerio from "cheerio";

export interface ParsedRanking {
  rank: number;
  name: string;
  hitsPerDay: number;
  period: string;
}

/**
 * Parse a DistroWatch popularity ranking page. The page lists rows shaped like:
 *   <tr><th class="phr1">1</th><td class="phr2"><a>MX Linux</a></td><td class="phr3">2500</td></tr>
 *
 * The parser validates shape and FAILS LOUDLY (throws) rather than returning
 * garbage, so a layout change never silently overwrites good data.
 */
export function parseDistrowatchRanking(
  html: string,
  period = "last-12-months",
): ParsedRanking[] {
  const $ = cheerio.load(html);
  const out: ParsedRanking[] = [];

  $("th.phr1").each((_, el) => {
    const $el = $(el);
    const tr = $el.closest("tr");
    const rank = Number.parseInt($el.text().trim(), 10);
    const name = tr.find("td.phr2 a").first().text().trim();
    const hitsText = tr.find("td.phr3").first().text().replace(/[^0-9]/g, "");
    const hitsPerDay = Number.parseInt(hitsText, 10);
    if (name && Number.isInteger(rank) && rank > 0 && Number.isInteger(hitsPerDay)) {
      out.push({ rank, name, hitsPerDay, period });
    }
  });

  if (out.length < 5) {
    throw new Error(
      `DistroWatch parse produced only ${out.length} rows; the page layout may have changed`,
    );
  }
  return out;
}
