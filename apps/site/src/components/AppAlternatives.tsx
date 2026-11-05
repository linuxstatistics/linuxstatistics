import { useMemo, useState } from "react";
import { SUPPORT_HELP, SUPPORT_LABEL, type AppAlternative, type Category, type Support } from "../lib/app-alternatives";

const FIRST = 20;

/** Searchable app table. Every row is in the HTML; rows past the first 20 are hidden until "Show all". */
export function AppAlternatives({ apps, categories }: { apps: AppAlternative[]; categories: Category[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [all, setAll] = useState(false);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apps.filter(
      (a) =>
        (cat === "all" || a.category === cat) &&
        (!needle || a.app.toLowerCase().includes(needle) || a.options.some((o) => o.name.toLowerCase().includes(needle))),
    );
  }, [apps, q, cat]);
  const filtering = q.trim() !== "" || cat !== "all";
  const collapsed = !all && !filtering && shown.length > FIRST;
  const used = categories.filter((c) => apps.some((a) => a.category === c));

  return (
    <div className="apps">
      <div className="apps-filters">
        <input
          type="search"
          className="apps-search"
          placeholder="Search an app, e.g. Photoshop"
          aria-label="Search apps"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="apps-cats" role="group" aria-label="Category">
          {(["all", ...used] as const).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>
      <p className="apps-count" aria-live="polite">
        {shown.length} of {apps.length} apps
      </p>
      <div className="table-scroll">
        <table className={`data-table apps-table${collapsed ? " apps-collapsed" : ""}`}>
          <thead>
            <tr>
              <th scope="col">You use</th>
              <th scope="col">On Linux</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.app}>
                <th scope="row">
                  {a.app}
                  <span className="th-sub">{a.category}</span>
                </th>
                <td>
                  <ul className="app-opts">
                    {a.options.map((o) => (
                      <li key={o.name}>
                        <span className="app-name">{o.name}</span> <SupportChip s={o.support} />
                        {o.note && <span className="app-note">{o.note}</span>}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {collapsed && (
        <p className="apps-more">
          <button type="button" className="chip" onClick={() => setAll(true)}>
            Show all {shown.length} apps
          </button>
        </p>
      )}
      {shown.length === 0 && <p className="note">No match. Try another name, or <a href="/suggest/?kind=correction">suggest an app</a>.</p>}
      <dl className="support-key">
        {(Object.keys(SUPPORT_LABEL) as Support[]).map((s) => (
          <div key={s}>
            <dt>
              <SupportChip s={s} />
            </dt>
            <dd>{SUPPORT_HELP[s]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SupportChip({ s }: { s: Support }) {
  return <span className={`sup sup-${s}`}>{SUPPORT_LABEL[s]}</span>;
}
