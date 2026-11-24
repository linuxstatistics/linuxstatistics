import { resolve } from "node:path";
import { expect, test } from "vitest";
import { articleDates, dataDate, lastmodFor, type LastmodContext } from "../src/lib/sitemap-lastmod";
import { STATUS_REVIEWED } from "../src/lib/miami-status";

const SITE = "https://linuxstatistics.com";
const ctx: LastmodContext = {
  data: "2026-11-17",
  articles: { "how-we-rank-distros": "2026-11-18", "interest-not-installs": "2026-11-10" },
  policies: "2026-11-15",
};

test("data pages carry the latest ingest date", () => {
  for (const p of ["/", "/distro/mint/", "/compare/fedora-vs-mint/", "/rising/", "/best/gaming/", "/support-dates/"]) {
    expect(lastmodFor(`${SITE}${p}`, ctx)).toBe("2026-11-17");
  }
});

test("articles carry their own date; the index and hubs the newest article's", () => {
  expect(lastmodFor(`${SITE}/articles/interest-not-installs/`, ctx)).toBe("2026-11-10");
  expect(lastmodFor(`${SITE}/articles/`, ctx)).toBe("2026-11-18");
  expect(lastmodFor(`${SITE}/articles/data/`, ctx)).toBe("2026-11-18");
});

test("legal pages carry the policies date; pages without a known date get none", () => {
  expect(lastmodFor(`${SITE}/privacy/`, ctx)).toBe("2026-11-15");
  expect(lastmodFor(`${SITE}/terms/`, ctx)).toBe("2026-11-15");
  expect(lastmodFor(`${SITE}/about/`, ctx)).toBeUndefined();
  expect(lastmodFor(`${SITE}/press/`, ctx)).toBeUndefined();
  expect(lastmodFor(`${SITE}/`, { ...ctx, data: null })).toBeUndefined();
});

test("the data date is the newest successful source, as a day", () => {
  expect(dataDate({ sources: [
    { source: "github", lastSuccessAt: "2026-11-12T03:00:00.000Z", status: "success" },
    { source: "wikipedia", lastSuccessAt: "2026-11-17T05:00:00.000Z", status: "success" },
    { source: "endoflife", lastSuccessAt: null, status: "never" },
  ] })).toBe("2026-11-17");
  expect(dataDate({ sources: [] })).toBeNull();
});

test("every published article has a date in the sitemap", () => {
  const dates = articleDates(resolve(process.cwd(), "apps/site/src/content/articles"));
  expect(Object.keys(dates).length).toBeGreaterThan(0);
  for (const d of Object.values(dates)) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("the hand-kept PC check page carries the date it shows as updated", () => {
  expect(lastmodFor(`${SITE}/can-i-run/gta-vi/`, ctx)).toBe(STATUS_REVIEWED);
  expect(lastmodFor(`${SITE}/can-i-run/gta-vi/`, { ...ctx, data: null })).toBe(STATUS_REVIEWED);
});
