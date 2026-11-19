import { useMemo, type ReactNode } from "react";
import { DistroMark } from "./DistroMark";
import { useDistroList } from "../lib/use-distro-list";
import { LIST_PATH } from "../lib/distro-list";

/** Shared pieces for the admin pages, so every page formats the same things the same way. */

const DAY = 86_400_000;

/** "18 Nov 2026" (UTC). */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** "18 Nov, 14:05 UTC". */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}, ${d.toISOString().slice(11, 16)} UTC`;
}

/** "today", "yesterday", "5 days ago", "3 weeks ago", "4 months ago". */
export function ago(iso: string, now = Date.now()): string {
  const days = (now - new Date(iso).getTime()) / DAY;
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 14) return `${Math.floor(days)} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/** A <time> with the full date-time as its tooltip and a relative or short label. */
export function When({ iso, relative = false }: { iso: string; relative?: boolean }) {
  return (
    <time dateTime={iso} title={dateTime(iso)}>
      {relative ? ago(iso) : shortDate(iso)}
    </time>
  );
}

/** Logo + name, linking to the distro page. */
export function Distro({ slug, name, link = true }: { slug: string; name: string; link?: boolean }) {
  const inner = (
    <>
      <DistroMark slug={slug} name={name} size={20} />
      <span>{name}</span>
    </>
  );
  return link ? <a className="adm-distro" href={`/distro/${slug}/`}>{inner}</a> : <span className="adm-distro">{inner}</span>;
}

export type Tone = "ok" | "bad" | "warn" | "info" | "neutral";

/** A status word in a pill. The text carries the meaning; the color only reinforces it. */
export function Status({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`adm-status${tone === "neutral" ? "" : ` is-${tone}`}`}>{children}</span>;
}

/** One metric: label, big number, context line. */
export function Metric({ label, value, sub, href }: { label: string; value: ReactNode; sub?: ReactNode; href?: string }) {
  return (
    <div className="adm-metric">
      <dt>{href ? <a href={href}>{label}<span className="icon-arrow" aria-hidden="true" /></a> : label}</dt>
      <dd>
        <span className="adm-metric-big">{value}</span>
        {sub != null && <span className="adm-metric-sub">{sub}</span>}
      </dd>
    </div>
  );
}

/** A titled page section. */
export function Section({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className="adm-sec">
      <h2>
        {title}
        {sub != null && <span className="adm-sec-sub">{sub}</span>}
      </h2>
      {children}
    </section>
  );
}

/** slug -> display name from the site's distro list (loaded once, after the page). Unknown slugs fall back to the slug. */
export function useDistroNames(): (slug: string) => string {
  const { items } = useDistroList<{ slug: string; name: string }>([], LIST_PATH);
  const map = useMemo(() => new Map(items.map((d) => [d.slug, d.name])), [items]);
  return (slug: string) => map.get(slug) ?? slug;
}
