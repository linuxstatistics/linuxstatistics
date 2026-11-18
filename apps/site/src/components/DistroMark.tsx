import { DISTRO_IMAGES, markId, markStyle, monogram } from "../lib/distro-marks";

export type MarkSize = 20 | 32 | 64;

/**
 * A distro's logo: a single-colour mark on a brand-colour tile, a full-colour
 * icon, or a monogram when we have neither. Decorative: the visible name next
 * to it carries the meaning.
 */
export function DistroMark({ slug, name, size = 20, deferred = false }: { slug: string; name: string; size?: MarkSize; /** Empty tile of the same size (long lists keep their HTML small until hydration). */ deferred?: boolean }) {
  if (deferred) return <span className={`dmark dmark-${size}`} aria-hidden="true" />;
  const s = markStyle(slug);
  if (s) {
    return (
      <span className={`dmark dmark-${size}`} style={{ background: s.bg, color: s.fg }} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <use href={`/marks.svg#${markId(slug)}`} />
        </svg>
      </span>
    );
  }
  const img = DISTRO_IMAGES[slug];
  if (img) {
    return (
      <span className={`dmark dmark-${size} dmark-img`} aria-hidden="true">
        <img src={`/marks/${img.file}`} alt="" width={size} height={size} loading="lazy" decoding="async" />
      </span>
    );
  }
  return (
    <span className={`dmark dmark-${size} dmark-mono`} aria-hidden="true">
      {monogram(name)}
    </span>
  );
}
