import type { NormalizedProfile, ProviderConfig } from "./providers.js";

type FetchImpl = typeof fetch;

/** Exchange an authorization code for an access token (form-encoded body, JSON response). */
export async function exchangeCode(
  p: ProviderConfig,
  code: string,
  redirectUri: string,
  fetchImpl: FetchImpl = fetch,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: p.clientId,
    client_secret: p.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetchImpl(p.tokenUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!json.access_token) {
    throw new Error(`token exchange failed for ${p.slug}${res.ok ? "" : `: ${res.status}`}`);
  }
  return json.access_token;
}

/** Fetch and normalize the signed-in user's profile from the forge userinfo endpoint. */
export async function fetchProfile(
  p: ProviderConfig,
  accessToken: string,
  fetchImpl: FetchImpl = fetch,
): Promise<NormalizedProfile> {
  const res = await fetchImpl(p.userinfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "linux-statistics",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`profile fetch failed for ${p.slug}: ${res.status}`);
  return p.mapProfile(await res.json());
}
