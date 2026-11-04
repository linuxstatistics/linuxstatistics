import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: import("@linux-statistics/db").UserRow;
  }
}

declare module "@fastify/secure-session" {
  interface SessionData {
    userId: number;
    oauthState: string;
  }
}
