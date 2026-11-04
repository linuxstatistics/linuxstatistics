import { useState } from "react";
import { compareSlug } from "../lib/compare";

export interface PickerOption {
  slug: string;
  name: string;
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
  const ready = a && b && a !== b;

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const slug = compareSlug(a, b);
    window.location.href = staticPairs.includes(slug)
      ? `/compare/${slug}/`
      : `/compare/?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
  }

  const select = (value: string, set: (v: string) => void, label: string) => (
    <select aria-label={label} value={value} onChange={(e) => set(e.target.value)}>
      <option value="">Choose a distro…</option>
      {options.map((o) => (
        <option key={o.slug} value={o.slug}>
          {o.name}
        </option>
      ))}
    </select>
  );

  return (
    <form className="picker-form" onSubmit={go}>
      {select(a, setA, "First distro")}
      <span>vs</span>
      {select(b, setB, "Second distro")}
      <button type="submit" disabled={!ready}>
        Compare
      </button>
    </form>
  );
}
