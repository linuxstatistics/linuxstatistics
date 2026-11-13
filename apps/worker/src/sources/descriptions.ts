/** MediaWiki lead extracts, plain text only. Titles come from verified enwiki aliases. */
export function descriptionUrl(title: string): string {
  const params = new URLSearchParams({ action: "query", format: "json", prop: "extracts|revisions|pageprops", exintro: "1", explaintext: "1", redirects: "1", rvprop: "ids", ppprop: "wikibase_item|disambiguation", titles: title });
  return `https://en.wikipedia.org/w/api.php?${params}`;
}

export function parseDescription(json: unknown, expectedQid?: string): { text: string; title: string; revisionId: number } {
  const data = json as { query?: { pages?: Record<string, { ns?: number; title?: string; extract?: string; missing?: unknown; pageprops?: Record<string, unknown>; revisions?: { revid?: number }[] }> } };
  const pages = Object.values(data?.query?.pages ?? {});
  if (pages.length !== 1) throw new Error("Expected one Wikipedia article");
  const p = pages[0]!;
  if (expectedQid && p.pageprops?.wikibase_item !== expectedQid) throw new Error("Wikipedia article identity does not match verified Wikidata item");
  const text = p.extract?.trim();
  const revisionId = p.revisions?.[0]?.revid;
  if (p.ns !== 0 || p.missing !== undefined || p.pageprops?.disambiguation !== undefined || !p.title || !text || text.length < 40 || text.length > 12000 || /<\/?[a-z][^>]*>/i.test(text) || !Number.isSafeInteger(revisionId) || revisionId! < 1) throw new Error("Missing, ambiguous or invalid Wikipedia description");
  return { text, title: p.title, revisionId: revisionId! };
}
