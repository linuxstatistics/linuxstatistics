import { expect, test } from "vitest";
import { assertNoDevLoginInProduction } from "../src/lib/session.js";

test("dev login is refused in production", () => {
  expect(() => assertNoDevLoginInProduction({ NODE_ENV: "production", ALLOW_DEV_LOGIN: "1" } as NodeJS.ProcessEnv)).toThrow(/not allowed/);
  expect(() => assertNoDevLoginInProduction({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).not.toThrow();
  expect(() => assertNoDevLoginInProduction({ ALLOW_DEV_LOGIN: "1" } as NodeJS.ProcessEnv)).not.toThrow();
});
