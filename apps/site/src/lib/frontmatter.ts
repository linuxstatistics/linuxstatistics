/**
 * Minimal front-matter reader for scripts that run outside Astro (noindex
 * generator, article:check). Handles what article front matter uses: strings
 * (quoted or bare), dates and flat arrays like ["a", "b"]. Anything else is a
 * string; the zod schema decides whether it's valid.
 */
export function readFrontmatter(md: string): { data: Record<string, unknown>; body: string } | null {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const data: Record<string, unknown> = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv as unknown as [string, string, string];
    const v = raw.trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      data[key] = v.slice(1, -1).split(",").map((x) => unquote(x.trim())).filter((x) => x !== "");
    } else {
      data[key] = unquote(v);
    }
  }
  return { data, body: m[2] ?? "" };
}

function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1).replace(/\\"/g, '"');
  return s;
}
