import { expect, test } from "vitest";
import { trustNote } from "../src/components/AdminRatings";

const NOW = new Date("2026-11-18T12:00:00Z").getTime();
const author = (provider: string, created: string | null) => ({ username: "x", provider, accountCreatedAt: created, joinedAt: "2026-11-01T00:00:00Z" });

test("trust note names the forge and the account age", () => {
  expect(trustNote(author("github", "2026-11-10T12:00:00Z"), NOW)).toBe("New GitHub account (8 days old)");
  expect(trustNote(author("gitlab", "2026-06-01T00:00:00Z"), NOW)).toBe("GitLab account, 5 months old");
  expect(trustNote(author("codeberg", "2023-11-01T00:00:00Z"), NOW)).toBe("Codeberg account, 3 years old");
  expect(trustNote(author("github", null), NOW)).toBe("GitHub account, age unknown");
});
