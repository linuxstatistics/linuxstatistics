/**
 * Remembers whether the visitor was signed in last time, so placeholders can
 * take the right shape before the account check finishes. Only a yes/no flag;
 * the real check always wins.
 */
const KEY = "ls_auth";

export function rememberAuth(signedIn: boolean): void {
  try {
    if (signedIn) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
    if (signedIn) document.documentElement.dataset.auth = "1";
    else delete document.documentElement.dataset.auth;
  } catch {
    /* storage blocked: placeholders use the signed-out shape */
  }
}
