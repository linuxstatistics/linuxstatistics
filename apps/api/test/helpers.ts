import type { FastifyInstance } from "fastify";

/** Log in via the dev-login seam and return the session cookie to replay. */
export async function loginAs(
  app: FastifyInstance,
  body: {
    providerUserId: string;
    username: string;
    provider?: "github" | "gitlab" | "codeberg";
    role?: "user" | "admin";
    accountCreatedAt?: string;
  },
): Promise<string> {
  const res = await app.inject({ method: "POST", url: "/api/auth/dev-login", payload: body });
  const setCookie = res.headers["set-cookie"];
  const raw = Array.isArray(setCookie) ? setCookie[0]! : String(setCookie);
  return raw.split(";")[0]!; // "ls_session=<value>"
}
