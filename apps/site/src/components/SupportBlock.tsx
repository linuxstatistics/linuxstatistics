import { useState } from "react";
import type { CryptoAddress, SupportLink } from "../config/support";

function CryptoRow({ c }: { c: CryptoAddress }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="crypto-row">
      <span className="crypto-name">{c.name}</span>
      <code className="crypto-addr" title={c.address}>
        {c.address}
      </code>
      <button
        type="button"
        className="crypto-copy"
        aria-label={`Copy ${c.name} address`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(c.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard blocked: the address is still selectable */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </li>
  );
}

/** Footer "Support" column: payment links, plus crypto addresses behind a toggle. */
export function SupportBlock({ links, crypto }: { links: SupportLink[]; crypto: CryptoAddress[] }) {
  const [showCrypto, setShowCrypto] = useState(false);
  return (
    <div className="support-block">
      <p>LinuxStatistics is independent and ad-free. Tips pay for hosting and data.</p>
      {links.length > 0 && (
        <ul className="support-links">
          {links.map((l) => (
            <li key={l.name}>
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                {l.name}
              </a>
              <span>{l.note}</span>
            </li>
          ))}
        </ul>
      )}
      {crypto.length > 0 && (
        <>
          <button type="button" className="crypto-toggle" aria-expanded={showCrypto} onClick={() => setShowCrypto((v) => !v)}>
            {showCrypto ? "Hide crypto addresses" : "Tip with crypto"}
          </button>
          {showCrypto && (
            <ul className="crypto-list">
              {crypto.map((c) => (
                <CryptoRow key={c.name} c={c} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
