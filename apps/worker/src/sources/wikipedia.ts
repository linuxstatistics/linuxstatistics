/**
 * Wikimedia Analytics API, monthly per-article page views (CC0). Docs:
 * https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/
 * `user` agent type excludes known crawlers and automated traffic.
 */
export function pageviewsUrl(title: string, fromMonth: string, toMonth: string): string {
  const start = `${fromMonth.replace("-", "")}0100`;
  const [y, m] = toMonth.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const end = `${toMonth.replace("-", "")}${String(last).padStart(2, "0")}00`;
  return `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title)}/monthly/${start}/${end}`;
}

/** Parse the API response into [{ month: "2026-10", views }]. Throws on an unexpected shape. */
export function parsePageviews(json: unknown): { month: string; views: number }[] {
  const items = (json as { items?: { timestamp?: string; views?: number }[] })?.items;
  if (!Array.isArray(items)) throw new Error("Wikimedia pageviews response has no items");
  return items.map((it) => {
    const ts = it.timestamp ?? "";
    if (!/^\d{10}$/.test(ts) || !Number.isInteger(it.views) || (it.views as number) < 0) {
      throw new Error(`Malformed pageviews item: ${JSON.stringify(it).slice(0, 80)}`);
    }
    return { month: `${ts.slice(0, 4)}-${ts.slice(4, 6)}`, views: it.views as number };
  });
}

/** Last complete month before `now` ("2026-10" in November 2026). */
export function lastFullMonth(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
