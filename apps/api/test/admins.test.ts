import { expect, test } from "vitest";
import { adminFromEnv, parseAdminUsers } from "../src/lib/admins.js";

const me = { provider: "github", providerUserId: "226349", username: "ChrisHrtmn" };

test("parses ids and names, ignores junk", () => {
  expect(parseAdminUsers(" github:#226349, gitlab:Chris , nope, :x, github: ")).toEqual([
    { provider: "github", id: "226349" },
    { provider: "gitlab", name: "chris" },
  ]);
});

test("matches by id or case-insensitive name, provider must match", () => {
  expect(adminFromEnv(me, "github:#226349")).toBe(true);
  expect(adminFromEnv(me, "github:chrishrtmn")).toBe(true);
  expect(adminFromEnv(me, "gitlab:chrishrtmn")).toBe(false);
  expect(adminFromEnv(me, "github:#1")).toBe(false);
});

test("unset means leave roles alone", () => {
  expect(adminFromEnv(me, undefined)).toBeNull();
  expect(adminFromEnv(me, "")).toBeNull();
});
