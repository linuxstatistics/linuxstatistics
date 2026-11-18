import { screenshotFor, shotSrc } from "../lib/screenshots";

const LICENSE_URL: Record<string, string> = {
  CC0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

const ext = { target: "_blank", "aria-describedby": "new-tab-description", title: "Opens in a new tab", rel: "noopener noreferrer" } as const;

/**
 * Default-desktop screenshot with its credit. Static HTML, lazy-loaded, with
 * width and height set so it never shifts the layout. Renders nothing when we
 * have no usable screenshot.
 */
export function DistroScreenshot({ slug, name, compact = false }: { slug: string; name: string; compact?: boolean }) {
  const s = screenshotFor(slug);
  if (!s) return null;
  const h640 = Math.round((s.height * 640) / s.width);
  const lic = LICENSE_URL[s.license];
  return (
    <figure className={`distro-shot${compact ? " distro-shot-compact" : ""}`}>
      <a href={shotSrc(slug, 1280)} aria-label={`${name} desktop screenshot, full size`}>
        <img
          src={shotSrc(slug, 640)}
          srcSet={`${shotSrc(slug, 640)} 640w, ${shotSrc(slug, 1280)} ${s.width}w`}
          sizes={compact ? "(max-width: 700px) 100vw, 360px" : "(max-width: 760px) 100vw, 720px"}
          width={640}
          height={h640}
          loading="lazy"
          decoding="async"
          alt={`The ${s.desktop} desktop on ${s.caption}`}
        />
      </a>
      <figcaption>
        {s.caption}, {s.desktop}{s.stale ? " (older release; no newer free screenshot yet)" : ""}. Screenshot: {s.author},{" "}
        {lic ? <a href={lic} {...ext}>{s.license}</a> : s.license}, via <a href={s.source} {...ext}>Wikimedia Commons</a>
      </figcaption>
    </figure>
  );
}
