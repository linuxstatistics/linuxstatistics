import { INTEL_MAC_NOTE, LIVE_USB_NOTE, OLD_NVIDIA_BAZZITE, OLD_NVIDIA_NOTE, WIFI_HOW_TO_CHECK, WIFI_NOTE, codeParts, hardwareHeading, type HardwareRisk } from "../lib/hardware-notes";

export interface HardwareNoteInput {
  risks: HardwareRisk[];
  /** Bazzite is among the suggestions, so its image advice applies. */
  bazzite?: boolean;
  /** Show the one-line live-USB tip when there's no specific risk (off for servers and boards). */
  liveUsb?: boolean;
}

function Text({ text }: { text: string }) {
  return <>{codeParts(text).map((p, i) => (p.code ? <code key={i}>{p.text}</code> : p.text))}</>;
}

/** Driver and Wi-Fi checks shown with quiz results: a box only for a specific risk, otherwise one quiet line. */
export function HardwareNotes({ risks, bazzite, liveUsb = true }: HardwareNoteInput) {
  if (risks.length === 0) {
    if (!liveUsb) return null;
    return (
      <p className="hardware-tip">
        {LIVE_USB_NOTE} <a href="/switch/getting-started/#hardware">How to check your computer</a>
      </p>
    );
  }
  return (
    <div className="hardware-notes">
      <h3>{hardwareHeading(risks)}</h3>
      {risks.includes("old-nvidia") && (
        <p>
          <span>Older NVIDIA card:</span> {OLD_NVIDIA_NOTE}
          {bazzite && <> {OLD_NVIDIA_BAZZITE}</>}
        </p>
      )}
      {risks.includes("intel-mac") && (
        <p>
          <span>Intel Mac:</span> {INTEL_MAC_NOTE}
        </p>
      )}
      {risks.includes("wifi") && (
        <p>
          <span>Wi-Fi:</span> {WIFI_NOTE} <Text text={WIFI_HOW_TO_CHECK} />
        </p>
      )}
      <p className="hardware-notes-more">
        <a href="/switch/getting-started/#hardware">How to check your computer</a>
      </p>
    </div>
  );
}
