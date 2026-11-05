import { useEffect, useState } from "react";
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
  options,
  staticPairs,
  initialA = "",
  initialB = "",
}: {
  options: PickerOption[];
  staticPairs: string[];
  initialA?: string;
  initialB?: string;
}) {
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  // On the any-pair view (/compare/?a=&b=) show the chosen pair in the boxes.
  useEffect(() => {
    if (initialA || initialB) return;
    const p = new URLSearchParams(window.location.search);
    const known = new Set(options.map((o) => o.slug));
    const qa = p.get("a");
    const qb = p.get("b");
    if (qa && known.has(qa)) setA(qa);
    if (qb && known.has(qb)) setB(qb);
  }, [initialA, initialB, options]);
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
      <DistroCombo items={options} value={a} onChange={setA} label="First distro" />
      <span>vs</span>
      <DistroCombo items={options.filter((o) => o.slug !== a)} value={b} onChange={setB} label="Second distro" />
      <button type="submit" disabled={!ready}>
        Compare
      </button>
    </form>
  );
}
