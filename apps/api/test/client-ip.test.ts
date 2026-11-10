import { expect, test } from "vitest";
import type { FastifyRequest } from "fastify";
import { clientIp } from "../src/app.js";

const req = (headers: Record<string, string>, ip = "10.0.0.1") => ({ headers, ip }) as unknown as FastifyRequest;

test("on Vercel, rate limits key on the platform's x-real-ip", () => {
  expect(clientIp(req({ "x-real-ip": "203.0.113.9" }), { VERCEL: "1" })).toBe("203.0.113.9");
  expect(clientIp(req({}), { VERCEL: "1" })).toBe("10.0.0.1");
});

test("elsewhere a client-sent x-real-ip is ignored", () => {
  expect(clientIp(req({ "x-real-ip": "203.0.113.9" }), {})).toBe("10.0.0.1");
});
