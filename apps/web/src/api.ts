import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Contribution,
  DistroDetail,
  DistroListItem,
  EmailSignupInput,
  GalaxyPayload,
  MarketSharePoint,
  Me,
  Meta,
  ProviderSummary,
} from "@linux-statistics/shared";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export function useDistros() {
  return useQuery({ queryKey: ["distros"], queryFn: () => get<DistroListItem[]>("/api/distros") });
}

export function useGalaxy() {
  return useQuery({ queryKey: ["galaxy"], queryFn: () => get<GalaxyPayload>("/api/galaxy") });
}

export function useDistro(slug: string | null) {
  return useQuery({
    queryKey: ["distro", slug],
    queryFn: () => get<DistroDetail>(`/api/distros/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useMarketShare() {
  return useQuery({
    queryKey: ["market-share"],
    queryFn: () => get<MarketSharePoint[]>("/api/market-share?region=global"),
  });
}

export function useMeta() {
  return useQuery({ queryKey: ["meta"], queryFn: () => get<Meta>("/api/meta") });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me | null> => {
      const res = await fetch(`${BASE}/api/me`, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`/api/me -> ${res.status}`);
      return res.json() as Promise<Me>;
    },
    retry: false,
  });
}

export function useUpsertContribution(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Contribution) => send(`PUT`, `/api/distros/${slug}/contribution`, c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distro", slug] });
      qc.invalidateQueries({ queryKey: ["distros"] });
    },
  });
}

export function useDeleteContribution(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => send(`DELETE`, `/api/distros/${slug}/contribution`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distro", slug] });
      qc.invalidateQueries({ queryKey: ["distros"] });
    },
  });
}

export function useEmailSignup() {
  return useMutation({
    mutationFn: (input: EmailSignupInput) =>
      send<{ ok: boolean }>("POST", "/api/email-signups", input),
  });
}

export function loginHref(slug: string): string {
  return `${BASE}/api/auth/${slug}`;
}

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: () => get<ProviderSummary[]>("/api/auth/providers"),
    staleTime: Infinity,
    retry: false,
  });
}

/** Dev-only: mint a local session without a real OAuth app. */
export async function devLogin(): Promise<void> {
  await fetch(`${BASE}/api/auth/dev-login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerUserId: "1", username: "dev" }),
  });
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
}
