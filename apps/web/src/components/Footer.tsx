import { SponsorSlot } from "./SponsorSlot";
import { EmailCapture } from "./EmailCapture";

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-bridges">
        <SponsorSlot />
        <EmailCapture />
      </div>
      <div className="footer-credit">
        Representative seed data · planet textures{" "}
        <a
          href="https://www.solarsystemscope.com/textures/"
          target="_blank"
          rel="noreferrer"
        >
          © Solar System Scope
        </a>{" "}
        (CC BY 4.0)
      </div>
    </footer>
  );
}
