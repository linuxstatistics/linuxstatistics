import type { AuthProvider } from "@linux-statistics/db";

export interface NormalizedProfile {
  provider: AuthProvider;
  providerUserId: string;
  username: string;
  avatarUrl: string | null;
  accountCreatedAt: Date | null;
}

export interface ProviderConfig {
  slug: AuthProvider;
  displayName: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  mapProfile(json: any): NormalizedProfile;
}

type ProviderDef = Omit<ProviderConfig, "clientId" | "clientSecret">;

const DEFS: ProviderDef[] = [
  {
    slug: "github",
    displayName: "GitHub",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userinfoUrl: "https://api.github.com/user",
    scope: "read:user",
    mapProfile: (u) => ({
      provider: "github",
      providerUserId: String(u.id),
      username: u.login,
      avatarUrl: u.avatar_url ?? null,
      accountCreatedAt: u.created_at ? new Date(u.created_at) : null,
    }),
  },
  {
    slug: "gitlab",
    displayName: "GitLab",
    authorizeUrl: "https://gitlab.com/oauth/authorize",
    tokenUrl: "https://gitlab.com/oauth/token",
    userinfoUrl: "https://gitlab.com/api/v4/user",
    scope: "read_user",
    mapProfile: (u) => ({
      provider: "gitlab",
      providerUserId: String(u.id),
      username: u.username,
      avatarUrl: u.avatar_url ?? null,
      accountCreatedAt: u.created_at ? new Date(u.created_at) : null,
    }),
  },
  {
    slug: "codeberg",
    displayName: "Codeberg",
    authorizeUrl: "https://codeberg.org/login/oauth/authorize",
    tokenUrl: "https://codeberg.org/login/oauth/access_token",
    userinfoUrl: "https://codeberg.org/api/v1/user",
    scope: "read:user",
    mapProfile: (u) => ({
      provider: "codeberg",
      providerUserId: String(u.id),
      username: u.login,
      avatarUrl: u.avatar_url ?? null,
      accountCreatedAt: u.created ? new Date(u.created) : null,
    }),
  },
];

const ENV_PREFIX: Record<AuthProvider, string> = {
  github: "GITHUB",
  gitlab: "GITLAB",
  codeberg: "CODEBERG",
};

export type ProviderRegistry = Map<AuthProvider, ProviderConfig>;

/** Build the registry, including only providers whose client id AND secret are set. */
export function buildProviderRegistry(env: NodeJS.ProcessEnv = process.env): ProviderRegistry {
  const reg: ProviderRegistry = new Map();
  for (const def of DEFS) {
    const prefix = ENV_PREFIX[def.slug];
    const clientId = env[`${prefix}_OAUTH_CLIENT_ID`];
    const clientSecret = env[`${prefix}_OAUTH_CLIENT_SECRET`];
    if (clientId && clientSecret) reg.set(def.slug, { ...def, clientId, clientSecret });
  }
  return reg;
}

/** Build the provider's authorize URL with the CSRF state and our callback. */
export function authorizeRedirect(p: ProviderConfig, redirectUri: string, state: string): string {
  const u = new URL(p.authorizeUrl);
  u.searchParams.set("client_id", p.clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", p.scope);
  u.searchParams.set("state", state);
  u.searchParams.set("response_type", "code");
  return u.toString();
}
