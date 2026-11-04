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
    firstReleaseYear: 2006, repoFullName: "linuxmint/cinnamon", rankTrend: 2, rank1m: 3, rank1mDelta: -1,
    userRating: { average: 4.5, count: 12, mean: 4.6, verifiedCount: 12 }, usesItCount: 30,
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

test("smoothedScore: null with no ratings, pulled toward the site mean, converges with volume", async () => {
  const { smoothedScore, RATING_PRIOR_WEIGHT } = await import("../src/views.js");
  expect(RATING_PRIOR_WEIGHT).toBe(5);
  expect(smoothedScore(0, 0, 3.5)).toBeNull();
  expect(smoothedScore(5, 1, 3)).toBeCloseTo((5 * 3 + 5) / 6, 6); // one 5-star -> 3.33
  expect(smoothedScore(5 * 200, 200, 3)).toBeGreaterThan(4.9); // many 5-stars -> near 5
});
