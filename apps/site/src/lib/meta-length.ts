/**
 * Search-result length limits for <title> and meta description. Bing's
 * webmaster tools flag titles over about 70 characters and descriptions
 * outside about 50 to 160; these limits leave a small margin.
 */
export const TITLE_MAX = 65;
export const DESC_MIN = 70;
export const DESC_MAX = 155;

const SUFFIX = " | LinuxStatistics";

/**
 * The page's title as it goes into <title>: the brand suffix stays when the
 * whole title fits, and is dropped when it alone pushes the title over the
 * limit. Page words are never cut; a title that's too long without the suffix
 * is left as is for the build check to catch, so it gets rewritten by hand.
 */
export function fitTitle(title: string): string {
  const t = title.trim();
  if (t.length <= TITLE_MAX || !t.endsWith(SUFFIX)) return t;
  return t.slice(0, -SUFFIX.length).trim();
}

/**
 * A description that fits the limit: cut at the last sentence end, else the
 * last word, that keeps it within DESC_MAX, with a trailing period. Short ones
 * are left alone for the build check.
 */
export function fitDescription(desc: string): string {
  const d = desc.trim().replace(/\s+/g, " ");
  if (d.length <= DESC_MAX) return d;
  const head = d.slice(0, DESC_MAX);
  const sentence = head.lastIndexOf(". ");
  if (sentence >= DESC_MIN) return head.slice(0, sentence + 1);
  const word = head.slice(0, DESC_MAX - 1).replace(/[\s,;:]+\S*$/, "");
  return `${word.replace(/[,;:.]+$/, "")}.`;
}
