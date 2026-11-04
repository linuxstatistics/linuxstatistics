import { AuthControl } from "./AuthControl";

export function Header() {
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
      </div>
    </header>
  );
}
