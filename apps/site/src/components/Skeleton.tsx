import type { CSSProperties } from "react";

/** A grey placeholder block. Hidden from screen readers; wrap groups in <SkeletonGroup>. */
export function Sk({ w, h = 14, r, className = "" }: { w?: number | string; h?: number | string; r?: number | string; className?: string }) {
  const style: CSSProperties = { width: w, height: h, borderRadius: r };
  return <span className={`sk ${className}`.trim()} style={style} aria-hidden="true" />;
}

/** Announces loading once to screen readers and holds the placeholder shapes. */
export function SkeletonGroup({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`sk-group ${className}`.trim()} role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

/** Header sign-in button, same size as the real one. */
export function AuthSkeleton() {
  return (
    <SkeletonGroup label="Loading account" className="sk-auth">
      <Sk w={92} h={36} r={999} />
    </SkeletonGroup>
  );
}

/**
 * Rating box. Two shapes: the full form (signed in) and the one-line sign-in
 * prompt (signed out). CSS shows one based on <html data-auth>, a hint saved
 * after the last sign-in check, so the box doesn't jump when it loads.
 */
export function RatingSkeleton() {
  return (
    <SkeletonGroup label="Loading rating form" className="rating-widget sk-rating">
      <span className="sk-rating-in">
        <span className="sk-row">
          {[0, 1, 2, 3, 4].map((i) => (
            <Sk key={i} w={26} h={26} r={6} />
          ))}
        </span>
        <Sk w={110} h={16} />
        <Sk w="100%" h={72} r={10} />
        <Sk w={78} h={36} r={999} />
      </span>
      <span className="sk-rating-out sk-row">
        <Sk w={96} h={16} />
        <Sk w={74} h={32} r={999} />
        <Sk w={74} h={32} r={999} />
      </span>
    </SkeletonGroup>
  );
}

/** Comparison table: heading plus label/value rows. */
export function CompareSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonGroup label="Loading comparison" className="sk-compare">
      <Sk w="45%" h={28} r={6} />
      <div className="sk-table">
        {Array.from({ length: rows }, (_, i) => (
          <div className="sk-tr" key={i}>
            <Sk w={`${55 + ((i * 13) % 30)}%`} />
            <Sk w={`${35 + ((i * 17) % 40)}%`} />
            <Sk w={`${35 + ((i * 11) % 40)}%`} />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

/** Admin list: a few card outlines. */
export function CardsSkeleton({ count = 3, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <SkeletonGroup label={label} className="sk-cards">
      {Array.from({ length: count }, (_, i) => (
        <div className="sk-card" key={i}>
          <Sk w="40%" h={16} />
          <Sk w="100%" />
          <Sk w="85%" />
          <Sk w={120} h={12} />
        </div>
      ))}
    </SkeletonGroup>
  );
}
