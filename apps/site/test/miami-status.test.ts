import { describe, expect, test } from "vitest";
import { ALLOWED_SOURCE_HOSTS, EVIDENCE, FEED_VISIBLE, GAMING_LINKS, NEVER_LINK_HOSTS, STATUS_REVIEWED, STATUS_ROWS, STATUS_STALE_DAYS, splitFeed, statusAgeDays, statusIsStale } from "../src/lib/miami-status";

const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

describe("evidence ledger", () => {
  test("the ledger is not empty", () => {
    expect(EVIDENCE.length).toBeGreaterThan(0);
    expect(STATUS_ROWS.length).toBeGreaterThan(0);
  });

  test("ids are unique, dates are real and not in the future, newest first", () => {
    expect(new Set(EVIDENCE.map((e) => e.id)).size).toBe(EVIDENCE.length);
    for (const e of EVIDENCE) {
      expect(isDate(e.date)).toBe(true);
      expect(e.date <= STATUS_REVIEWED).toBe(true);
    }
    const dates = EVIDENCE.map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test("'confirmed' needs an official source", () => {
    for (const e of EVIDENCE) if (e.confidence === "confirmed") expect(e.kind).toBe("official");
    for (const e of EVIDENCE) if (e.kind === "community") expect(e.confidence).toBe("unverified");
  });

  test("official and press entries link to https pages; community claims carry no link", () => {
    for (const e of EVIDENCE) {
      if (e.kind === "community") expect(e.source.href).toBeUndefined();
      else expect(e.source.href).toMatch(/^https:\/\//);
    }
  });

  test("nothing links to code, chat, social or file hosts", () => {
    for (const e of EVIDENCE) {
      if (!e.source.href) continue;
      const host = new URL(e.source.href).hostname.replace(/^www\./, "");
      expect(NEVER_LINK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))).toBe(false);
    }
  });

  test("official and press entries link only to a reviewed host", () => {
    for (const e of EVIDENCE) {
      if (!e.source.href) continue;
      const host = new URL(e.source.href).hostname.replace(/^www\./, "");
      expect(ALLOWED_SOURCE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)), `${e.id} links to ${host}`).toBe(true);
      if (e.kind === "official") expect(host).toBe("rockstargames.com");
    }
  });

  test("every string that reaches the page or the repo carries no URL and no code-host, social or how-to words", () => {
    const fields = [
      ...EVIDENCE.flatMap((e) => [e.id, e.text, e.source.name, e.short]),
      ...STATUS_ROWS.flatMap((r) => [r.id, r.label, r.state, r.summary]),
    ];
    const text = fields.join(" ").toLowerCase();
    expect(text).not.toMatch(/https?:|www\./);
    for (const word of ["github", "gitlab", "codeberg", "discord", "telegram", "reddit", "twitter", "repositor", "download link", "mirror", "torrent", "crack", "dump", "how to"]) expect(text).not.toContain(word);
  });
});

describe("status board", () => {
  test("every row cites real evidence", () => {
    const ids = new Set(EVIDENCE.map((e) => e.id));
    for (const r of STATUS_ROWS) for (const id of r.evidence) expect(ids.has(id)).toBe(true);
    expect(STATUS_ROWS.map((r) => r.id)).toEqual(["official", "community", "ready"]);
  });
});

describe("staleness", () => {
  test("counts whole days and flags after the limit", () => {
    expect(statusAgeDays("2026-11-24", "2026-11-24")).toBe(0);
    expect(statusAgeDays("2026-12-01", "2026-11-24")).toBe(7);
    expect(statusIsStale("2026-12-08", "2026-11-24")).toBe(false);
    expect(statusIsStale("2026-12-09", "2026-11-24")).toBe(true);
    expect(STATUS_STALE_DAYS).toBe(14);
  });
});

describe("reports feed", () => {
  test("shows the newest few and keeps the rest, in order, behind the toggle", () => {
    const { recent, older } = splitFeed(EVIDENCE);
    expect(recent).toEqual(EVIDENCE.slice(0, FEED_VISIBLE));
    expect([...recent, ...older]).toEqual(EVIDENCE);
    expect(recent.length).toBeLessThanOrEqual(FEED_VISIBLE);
  });

  test("a short list has nothing behind the toggle", () => {
    expect(splitFeed([1, 2], 3)).toEqual({ recent: [1, 2], older: [] });
    expect(splitFeed([], 3)).toEqual({ recent: [], older: [] });
  });

  test("the visible group never hides a newer report behind an older one", () => {
    const { recent, older } = splitFeed(EVIDENCE);
    const oldestShown = recent.at(-1)?.date ?? "";
    for (const e of older) expect(e.date <= oldestShown).toBe(true);
  });
});

describe("Linux gaming links", () => {
  test("internal links are site paths and outside links are only the two lookups the page allows", () => {
    expect(GAMING_LINKS.length).toBeGreaterThan(0);
    for (const l of GAMING_LINKS) {
      if (l.external) {
        expect(["areweanticheatyet.com", "www.protondb.com"]).toContain(new URL(l.href).host);
      } else {
        expect(l.href).toMatch(/^\/[a-z0-9\-/]*\/$/);
      }
      expect(l.note.length).toBeGreaterThan(0);
    }
  });

  test("names are unique", () => {
    expect(new Set(GAMING_LINKS.map((l) => l.name)).size).toBe(GAMING_LINKS.length);
  });
});
