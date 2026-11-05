import { useMemo, useState, type ReactNode } from "react";
import type { DistroListItem, DistroStatus, Family } from "@linux-statistics/shared";
import { FAMILY_LABELS, familyColor } from "../lib/families";
import { formatRating } from "../lib/rating";

type SortKey =
  | "rank"
  | "name"
  | "family"
  | "hitsPerDay"
  | "stars"
  | "commitsLast30d"
  | "firstReleaseYear"
  | "rankTrend"
  | "rank1mDelta"
  | "rating";

function Trend({ value }: { value: number | null }) {
  if (value === null || value === 0) return <span className="trend flat">=</span>;
  return value > 0 ? (
    <span className="trend up">▲ {value}</span>
  ) : (
    <span className="trend down">▼ {Math.abs(value)}</span>
  );
}

export function distroHref(slug: string): string {
  return `/distro/${slug}/`;
}

function starsCell(d: DistroListItem): ReactNode {
  return d.stars === null ? "-" : d.stars.toLocaleString();
}

interface ColumnDef {
  key: SortKey;
  label: string;
  numeric?: boolean;
  /** hidden on narrow screens via CSS */
  mobileHide?: boolean;
  /** always shown; not user-toggleable */
  fixed?: boolean;
  /** hidden until the user turns it on in the Columns menu */
  hiddenByDefault?: boolean;
  /** extra class on the cells */
  cellClass?: string;
  render: (d: DistroListItem) => ReactNode;
}

const COLUMNS: ColumnDef[] = [
  { key: "rank", label: "#", numeric: true, fixed: true, cellClass: "rank", render: (d) => d.rank ?? "-" },
  {
    key: "name",
    label: "Distro",
    fixed: true,
    render: (d) => <a href={distroHref(d.slug)}>{d.name}</a>,
  },
  {
    key: "family",
    label: "Family",
    cellClass: "fam-cell",
    render: (d) => (
      <span className={`fam f-${d.family}`} style={{ color: familyColor(d.family) }}>
        {FAMILY_LABELS[d.family].toLowerCase()}
      </span>
    ),
  },
  { key: "hitsPerDay", label: "Hits/day", numeric: true, render: (d) => d.hitsPerDay?.toLocaleString("en-US") ?? "-" },
  { key: "rank1mDelta", label: "1 mo", numeric: true, render: (d) => <Trend value={d.rank1mDelta} /> },
  { key: "stars", label: "GitHub", numeric: true, mobileHide: true, render: starsCell },
  {
    key: "rating",
    label: "Rating",
    numeric: true,
    mobileHide: true,
    hiddenByDefault: true,
    render: (d) => formatRating(d.userRating),
  },
  { key: "commitsLast30d", label: "Commits/mo", numeric: true, mobileHide: true, hiddenByDefault: true, render: (d) => d.commitsLast30d?.toLocaleString() ?? "-" },
  { key: "firstReleaseYear", label: "Released", numeric: true, mobileHide: true, render: (d) => d.firstReleaseYear ?? "-" },
  { key: "rankTrend", label: "Trend", numeric: true, mobileHide: true, render: (d) => <Trend value={d.rankTrend} /> },
];

const TOGGLEABLE = COLUMNS.filter((c) => !c.fixed);

function thtdClass(c: ColumnDef): string {
  return [c.numeric ? "num" : "", c.mobileHide ? "col-hide-mobile" : ""].filter(Boolean).join(" ");
}

function compare(a: DistroListItem, b: DistroListItem, key: SortKey): number {
  if (key === "rating") {
    // Sentinel keeps unrated distros (null average) last in descending order.
    return (a.userRating.average ?? -1) - (b.userRating.average ?? -1);
  }
  const av = a[key];
  const bv = b[key];
  if (av === null || av === undefined) return 1;
  if (bv === null || bv === undefined) return -1;
  if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv);
  return (av as number) - (bv as number);
}

export interface ListViewProps {
  items: DistroListItem[];
  /** Rows shown before "Show more"; each click adds this many again. 0 = show all. */
  pageSize?: number;
  /** First batch size when it differs (e.g. 97 so the table ends at #100 under a top-3 podium). */
  firstPage?: number;
  /** Rows shown elsewhere on the page (the podium), counted in the totals. */
  offset?: number;
}

export function ListView({ items, pageSize = 0, firstPage, offset = 0 }: ListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [asc, setAsc] = useState(true);
  const [family, setFamily] = useState<Family | "all">("all");
  const [status, setStatus] = useState<DistroStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<ReadonlySet<SortKey>>(
    () => new Set(COLUMNS.filter((c) => c.hiddenByDefault).map((c) => c.key)),
  );
  const [colsOpen, setColsOpen] = useState(false);
  const [limit, setLimit] = useState(firstPage ?? pageSize);

  const visibleColumns = COLUMNS.filter((c) => !hidden.has(c.key));

  const families = useMemo(
    () => Array.from(new Set(items.map((i) => i.family))).sort(),
    [items],
  );
  const hasDiscontinued = useMemo(
    () => items.some((i) => i.status === "discontinued"),
    [items],
  );

  const rows = useMemo(() => {
    let r = items;
    if (family !== "all") r = r.filter((i) => i.family === family);
    if (status !== "all") r = r.filter((i) => i.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((i) => i.name.toLowerCase().includes(q));
    }
    const sorted = [...r].sort((a, b) => compare(a, b, sortKey));
    return asc ? sorted : sorted.reverse();
  }, [items, family, status, search, sortKey, asc]);

  // Searching or filtering looks through everything; only the shown rows are capped.
  const shown = limit > 0 ? rows.slice(0, limit) : rows;
  const remaining = rows.length - shown.length;
  const nextBatch = Math.min(pageSize, remaining);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === "rank" || key === "name");
    }
  }

  function toggleColumn(key: SortKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="list-view">
      <div className="list-controls">
        <input
          className="search"
          type="search"
          placeholder="Search distros…"
          value={search}
          aria-label="Search distros"
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="family-filter"
          value={family}
          aria-label="Filter by family"
          onChange={(e) => setFamily(e.target.value as Family | "all")}
        >
          <option value="all">All families</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {FAMILY_LABELS[f]}
            </option>
          ))}
        </select>
        {hasDiscontinued && (
          <select
            className="family-filter"
            value={status}
            aria-label="Filter by status"
            onChange={(e) => setStatus(e.target.value as DistroStatus | "all")}
          >
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
          </select>
        )}
        <div className="col-menu t-acc" data-open={colsOpen}>
          <button
            type="button"
            className="col-menu-btn t-acc-head"
            aria-expanded={colsOpen}
            aria-label="Choose columns"
            onClick={() => setColsOpen((o) => !o)}
          >
            Columns
            <span className="t-acc-chevron" aria-hidden>
              <svg viewBox="0 0 16 16">
                <path d="M4 6.5L8 10.5L12 6.5" />
              </svg>
            </span>
          </button>
          {colsOpen && (
            <div className="col-menu-backdrop" onClick={() => setColsOpen(false)} />
          )}
          <div className="t-acc-panel">
            <div className="t-acc-panel-inner col-menu-panel">
              {TOGGLEABLE.map((c) => (
                <label key={c.key} className="col-toggle">
                  <input
                    type="checkbox"
                    checked={!hidden.has(c.key)}
                    onChange={() => toggleColumn(c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="leaderboard">
          <thead>
            <tr>
              {visibleColumns.map((c) => (
                <th
                  key={c.key}
                  className={thtdClass(c)}
                  aria-sort={sortKey === c.key ? (asc ? "ascending" : "descending") : "none"}
                >
                  <button type="button" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sortKey === c.key ? (asc ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.slug}>
                {visibleColumns.map((c) => (
                  <td
                    key={c.key}
                    className={[
                      thtdClass(c),
                      c.cellClass ?? "",
                      c.key === "name" ? "distro-name-cell" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {c.render(d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {remaining > 0 && (
        <div className="list-more">
          <button type="button" onClick={() => setLimit((l) => l + pageSize)}>
            Show next {nextBatch}
          </button>
          <button type="button" className="list-more-all" onClick={() => setLimit(0)}>
            Show all {rows.length + offset}
          </button>
          <span className="list-count">
            Showing {shown.length + offset} of {rows.length + offset}
          </span>
        </div>
      )}
    </div>
  );
}
