import { markId, markStyle, monogram } from "../lib/distro-marks";

export type MarkSize = 20 | 32 | 64;

/**
 * A distro's logo on a brand-colour tile, or a monogram when we have no mark.
 * Decorative: the visible name next to it carries the meaning.
 */
export function DistroMark({ slug, name, size = 20 }: { slug: string; name: string; size?: MarkSize }) {
  const s = markStyle(slug);
  if (!s) {
    return (
      <span className={`dmark dmark-${size} dmark-mono`} aria-hidden="true">
        {monogram(name)}
      </span>
    );
  }
  return (
    <span className={`dmark dmark-${size}`} style={{ background: s.bg, color: s.fg }} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <use href={`/marks.svg#${markId(slug)}`} fill="currentColor" />
      </svg>
    </span>
  );
}
