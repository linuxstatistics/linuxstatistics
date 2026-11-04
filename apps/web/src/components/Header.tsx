import { useStore } from "../store";
import { AuthControl } from "./AuthControl";

export function Header({ canUseGalaxy }: { canUseGalaxy: boolean }) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  return (
    <header className="app-header">
      <div className="brand">
        <span className="logo" aria-hidden>◐</span>
        <div>
          <h1>LinuxStatistics</h1>
          <p>the Linux distro universe</p>
        </div>
      </div>
      <div className="header-right">
        <AuthControl />
        {canUseGalaxy && (
          <div className="toggle" role="group" aria-label="View">
            <button className={view === "galaxy" ? "active" : ""} onClick={() => setView("galaxy")}>
              Galaxy
            </button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
              List
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
