import { expect, test } from "vitest";
import { formatRating, ratingDetail } from "../src/lib/rating";

test("formats the score and the verified share", () => {
  expect(formatRating({ average: 4.234, count: 12, mean: 4.5, verifiedCount: 9 })).toBe("★ 4.2 (12)");
  expect(formatRating({ average: null, count: 0, mean: null, verifiedCount: 0 })).toBe("—");
  expect(ratingDetail({ average: 4, count: 12, mean: 4.5, verifiedCount: 9 })).toBe("12 ratings · 75% from verified accounts");
  expect(ratingDetail({ average: 4, count: 1, mean: 4, verifiedCount: 1 })).toBe("1 rating · 100% from verified accounts");
  expect(ratingDetail({ average: null, count: 0, mean: null, verifiedCount: 0 })).toBe("No ratings yet");
});
