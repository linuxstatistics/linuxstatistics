import { AuthControl } from "./AuthControl";
import { Island } from "./Island";

/** Island: sign-in / account control in the header. */
export function HeaderAuth() {
  return (
    <Island>
      <AuthControl />
    </Island>
  );
}
