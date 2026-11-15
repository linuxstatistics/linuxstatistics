import { OLD_NVIDIA_BAZZITE, OLD_NVIDIA_NOTE, WIFI_HOW_TO_CHECK, WIFI_NOTE, codeParts } from "../lib/hardware-notes";

export interface HardwareNoteInput {
  oldNvidia?: boolean;
  /** Bazzite is among the suggestions, so its image advice applies. */
  bazzite?: boolean;
  /** "risky": the chosen chip often needs extra drivers; "check": unknown chip; "fine": Intel or similar. */
  wifi?: "risky" | "check" | "fine";
}

function Text({ text }: { text: string }) {
  return <>{codeParts(text).map((p, i) => (p.code ? <code key={i}>{p.text}</code> : p.text))}</>;
}

/** Driver and Wi-Fi checks shown with quiz results. Renders nothing when nothing applies. */
export function HardwareNotes({ oldNvidia, bazzite, wifi = "check" }: HardwareNoteInput) {
  if (!oldNvidia && wifi === "fine") return null;
  return (
    <div className="hardware-notes">
      <h3>Check your hardware first</h3>
      {oldNvidia && (
        <p>
          <span>Older NVIDIA card:</span> {OLD_NVIDIA_NOTE}
          {bazzite && <> {OLD_NVIDIA_BAZZITE}</>}
        </p>
      )}
      {wifi !== "fine" && (
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
