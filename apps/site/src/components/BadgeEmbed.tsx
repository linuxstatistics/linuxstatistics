import { useState } from "react";

function CopyRow({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="embed-row">
      <span className="embed-label">{label}</span>
      <code className="embed-code">{text}</code>
      <button
        type="button"
        className="crypto-copy"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard blocked: the text is still selectable */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** "Badge for your README": preview plus copy-ready Markdown and HTML. */
export function BadgeEmbed({ slug, name, markdown, html }: { slug: string; name: string; markdown: string; html: string }) {
  return (
    <div className="badge-embed">
      <p className="badge-preview">
        <img src={`/badge/${slug}.svg`} alt={`${name} on LinuxStatistics`} height={20} />
        <img src={`/badge/${slug}-light.svg`} alt="" height={20} />
      </p>
      <CopyRow label="Markdown" text={markdown} />
      <CopyRow label="HTML" text={html} />
    </div>
  );
}
