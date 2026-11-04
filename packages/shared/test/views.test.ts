import { expect, test } from "vitest";
import {
  contributionSchema,
  distroListItemSchema,
  emailSignupInputSchema,
  meSchema,
} from "../src/views.js";

test("distroListItem carries first-party rating aggregates", () => {
  const parsed = distroListItemSchema.parse({
    slug: "mint", name: "Linux Mint", family: "debian", status: "active",
    rank: 1, hitsPerDay: 2600, stars: 5200, commitsLast30d: 180,
    firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", rankTrend: 2,
    userRating: { average: 4.5, count: 12 }, usesItCount: 30,
  });
  expect(parsed.userRating.average).toBe(4.5);
  expect(parsed.usesItCount).toBe(30);
});

test("contribution allows a null rating but typed fields", () => {
  const c = contributionSchema.parse({ rating: null, usesIt: true, reviewBody: null });
  expect(c.usesIt).toBe(true);
});

test("me schema captures identity + role", () => {
  const me = meSchema.parse({ id: 1, provider: "github", username: "octocat", avatarUrl: null, role: "user" });
  expect(me.role).toBe("user");
  expect(me.provider).toBe("github");
  expect(me.username).toBe("octocat");
});

test("email signup accepts a valid email and optional source", () => {
  const ok = emailSignupInputSchema.parse({ email: "me@example.com", source: "footer" });
  expect(ok.email).toBe("me@example.com");
  expect(ok.source).toBe("footer");
});

test("email signup rejects an invalid email", () => {
  expect(() => emailSignupInputSchema.parse({ email: "nope" })).toThrow();
});
