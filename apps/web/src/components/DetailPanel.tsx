import { useDistro } from "../api";
import { useStore } from "../store";
import { DistroDetailBody } from "./DistroDetailBody";

export function DetailPanel() {
  const slug = useStore((s) => s.selectedSlug);
  const setSelected = useStore((s) => s.setSelected);
  const { data, isLoading } = useDistro(slug);

  if (!slug) return null;

  return (
    <aside className="detail-panel">
      <button className="close" aria-label="Close" onClick={() => setSelected(null)}>
        ×
      </button>
      {isLoading || !data ? (
        <p className="loading">Loading…</p>
      ) : (
        <DistroDetailBody data={data} />
      )}
    </aside>
  );
}
