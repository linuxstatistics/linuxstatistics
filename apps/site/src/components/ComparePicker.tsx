import { useEffect, useState } from "react";
import { useDistroList } from "../lib/use-distro-list";
import { compareSlug } from "../lib/compare";
import { DistroCombo } from "./DistroCombo";

export interface PickerOption {
  slug: string;
  name: string;
  rank: number | null;
}

/**
 * Pick any two distros. Popular pairs have their own static page; any other
 * pair opens the client-rendered comparison at /compare/?a=&b=.
 */
export function ComparePicker({
  options: initial,
  src,
  staticPairs,
  initialA = "",
  initialB = "",
}: {
  /** Choices in the HTML; with `src`, the top ones (and any preselected), the rest loads on first focus. */
  options: PickerOption[];
  src?: string;
  staticPairs: string[];
  initialA?: string;
  initialB?: string;
}) {
  const [wanted, setWanted] = useState(false);
  const { items: options } = useDistroList(initial, src, wanted);
  const want = () => setWanted(true);
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  // On the any-pair view (/compare/?a=&b=) show the chosen pair in the boxes.
  useEffect(() => {
    if (initialA || initialB) return;
    const p = new URLSearchParams(window.location.search);
    const qa = p.get("a");
    const qb = p.get("b");
    if (!qa && !qb) return;
    const known = new Set(options.map((o) => o.slug));
    // A pair outside the choices in the HTML needs the full list to show its names.
    if (src && !wanted && ((qa && !known.has(qa)) || (qb && !known.has(qb)))) {
      setWanted(true);
      return;
    }
    if (qa && known.has(qa)) setA(qa);
    if (qb && known.has(qb)) setB(qb);
  }, [initialA, initialB, options, src, wanted]);
  const ready = a && b && a !== b;

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const slug = compareSlug(a, b);
    window.location.href = staticPairs.includes(slug)
      ? `/compare/${slug}/`
      : `/compare/?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
  }

  return (
    <form className="picker-form" onSubmit={go}>
      <DistroCombo items={options} value={a} onChange={setA} onWant={want} label="First distro" />
      <span className="vs-badge" aria-hidden="true">vs</span>
      <DistroCombo items={options.filter((o) => o.slug !== a)} value={b} onChange={setB} onWant={want} label="Second distro" />
      <button type="submit" disabled={!ready}>
        Compare
      </button>
    </form>
  );
}
