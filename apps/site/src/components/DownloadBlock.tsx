import { verifyLabel, type VerifyPage } from "../lib/verify-pages";

const ext = { target: "_blank", "aria-describedby": "new-tab-description", title: "Opens in a new tab", rel: "noopener noreferrer" } as const;

/**
 * Official download, the project's checksum page and our verify guide. We never
 * host images or link mirrors we don't control. Static HTML, no client JS.
 */
export function DownloadBlock({ name, downloadUrl, verify, distrosea, compact = false }: { name: string; downloadUrl: string; verify: VerifyPage | null; distrosea?: string; compact?: boolean }) {
  const Heading = compact ? "h4" : "h2";
  return (
    <section className={`download-block${compact ? " download-block-compact" : ""}`} aria-label={`Download ${name}`}>
      <Heading>Download {name}</Heading>
      <ul>
        <li>
          <a href={downloadUrl} {...ext}>Official download page</a>
          <span className="dl-note">from the {name} project</span>
        </li>
        {verify && (
          <li>
            <a href={verify.url} {...ext}>{verify.kind === "instructions" || verify.hash === null ? "Official verify instructions" : "Official checksums"}</a>
            <span className="dl-note">{verifyLabel(verify)}</span>
          </li>
        )}
        <li>
          <a href="/guides/verify-download/">How to verify a download</a>
          <span className="dl-note">one command on Windows, macOS or Linux</span>
        </li>
        {distrosea && !compact && (
          <li>
            <a href={`https://distrosea.com/select/${distrosea}/`} {...ext}>Try it in your browser</a>
            <span className="dl-note">DistroSea, no install</span>
          </li>
        )}
      </ul>
      {!compact && <p className="dl-foot">We never host images. Always download from the project's own site.</p>}
    </section>
  );
}
