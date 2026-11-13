import { TELEMETRY_LABEL, telemetryFor } from "../lib/telemetry";

/** Commands and file paths in an instruction are shown as code; the words around them stay plain. */
function turnOffParts(text: string) {
  const m = /^(.*?\bRun: |.*?\brun: )(.+)$/.exec(text);
  if (m) return <>{m[1]}<code>{m[2]}</code></>;
  return text.split(/(\S*\/\S+|countme=0)/).map((part, i) => (i % 2 ? <code key={i}>{part.replace(/\.$/, "")}</code> : part));
}

/** "Telemetry" block on a distro page. Says nothing for distros we haven't checked. */
export function TelemetryNote({ slug }: { slug: string }) {
  const t = telemetryFor(slug);
  return (
    <section className="telemetry" aria-labelledby="telemetry-h">
      <h2 id="telemetry-h">Telemetry</h2>
      {t ? (
        <>
          <span className={`tm-badge tm-${t.level}`}>{TELEMETRY_LABEL[t.level]}</span>
          <p className="tm-detail">{t.detail}</p>
          {t.turnOff && (
            <p className="tm-off">
              To turn it off: {turnOffParts(t.turnOff)}
            </p>
          )}
          <p className="note">
            The OS itself, by default. Every distro contacts its servers to check for updates; that isn't counted here. Apps you install have their own settings.{" "}
            {t.checked === "build" ? "Checked in the project's build files." : "Based on the project's own statement."}{" "}
            <a href={t.source} target="_blank" aria-describedby="new-tab-description" title="Opens in a new tab" rel="noopener noreferrer">
              Source
            </a>
          </p>
        </>
      ) : (
        <p className="note">
          Not checked yet. We only list what we've confirmed in the project's own documentation.{" "}
          <a href={`/suggest/?kind=correction&subject=${encodeURIComponent(`${slug} telemetry`)}`}>Know where it's documented? Help check this</a>.
        </p>
      )}
    </section>
  );
}
