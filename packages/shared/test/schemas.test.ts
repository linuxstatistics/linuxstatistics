import { expect, test } from "vitest";
import {
  distroSchema,
  popularitySnapshotSchema,
  marketShareSchema,
} from "../src/schemas.js";

test("distroSchema parses a valid distro", () => {
  const d = distroSchema.parse({
    slug: "ubuntu",
    name: "Ubuntu",
    family: "debian",
    basedOnSlug: "debian",
    homepage: "https://ubuntu.com",
    logoUrl: null,
    firstReleaseYear: 2004,
    status: "active",
  });
  expect(d.slug).toBe("ubuntu");
  expect(d.basedOnSlug).toBe("debian");
});

test("distroSchema rejects an invalid family", () => {
  expect(() =>
    distroSchema.parse({ slug: "x", name: "X", family: "bsd", status: "active" }),
  ).toThrow();
});

test("popularitySnapshotSchema requires a positive rank", () => {
  expect(() =>
    popularitySnapshotSchema.parse({
      source: "distrowatch",
      distroSlug: "ubuntu",
      capturedAt: "2026-06-23T00:00:00.000Z",
      rank: 0,
      hitsPerDay: 1500,
      period: "last-12-months",
    }),
  ).toThrow();
});

test("marketShareSchema clamps share to 0..100", () => {
  expect(() =>
    marketShareSchema.parse({
      capturedAt: "2026-06-01T00:00:00.000Z",
      region: "global",
      platform: "linux",
      sharePct: 150,
    }),
  ).toThrow();
});
