import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { REFERENCE_PROFILES, referenceFor } from "../src/lib/reference-profiles";
import { PROFILES } from "../src/lib/picker-profiles";
import { ReferenceCard } from "../src/components/ReferenceCard";
import { reasonsFor } from "../src/lib/verdict";
import { nextSteps } from "../src/lib/compare-links";

afterEach(cleanup);

test("reference cards are never quiz picks, are unique, and are sourced and plain", () => {
  const quiz = new Set(PROFILES.map((p) => p.key));
  const keys = REFERENCE_PROFILES.map((p) => p.key);
  expect(new Set(keys).size).toBe(keys.length);
  for (const p of REFERENCE_PROFILES) {
    expect(quiz.has(p.key), `${p.key} is also a quiz profile`).toBe(false);
    expect(p.start.href, p.key).toMatch(/^https:\/\//);
    expect(p.source, p.key).toMatch(/^https:\/\//);
    expect(p.goodFor.length, p.key).toBeGreaterThan(0);
    for (const g of p.goodFor) expect(g, p.key).toMatch(/^(you\b|you're|your) /);
    expect([p.summary, p.notFor, ...p.goodFor].join(" "), p.key).not.toMatch(/[—]/);
    if (p.instead) expect(quiz.has(p.instead.slug) || keys.includes(p.instead.slug), `${p.key} instead -> ${p.instead.slug}`).toBe(true);
  }
});

test("the card says who it's for, what to know first, and points desktop users elsewhere", () => {
  render(<ReferenceCard name="FreeBSD" profile={referenceFor("freebsd")!} insteadName="GhostBSD" />);
  expect(screen.getByText("BSD operating system · not Linux")).toBeInTheDocument();
  expect(screen.getByText("Good for you if:")).toBeInTheDocument();
  expect(screen.getByText(/^You want ZFS and jails built in$/)).toBeInTheDocument();
  expect(screen.getByText("Before you choose it:")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "GhostBSD" })).toHaveAttribute("href", "/distro/ghostbsd/");
  expect(screen.getByRole("link", { name: /FreeBSD's own site/ })).toHaveAttribute("href", "https://www.freebsd.org/about/");
});

test("on compare pages a reference system gets its own reasons and summary", () => {
  const reasons = reasonsFor({ slug: "truenas", name: "TrueNAS", family: "other", rank: 45 }).map((r) => r.text);
  expect(reasons).toContain("you're building a NAS or home file server");
  expect(nextSteps({ slug: "proxmox", homepage: null, repoFullName: null, description: null }).summary).toMatch(/^Proxmox VE is a free/);
});

test("compare pages fall back to a reference card's good-for and caution as pros and cons", async () => {
  const { compareNotes } = await import("../src/lib/reference-profiles");
  const { notesFor } = await import("../src/lib/distro-notes");
  const n = compareNotes("freebsd", notesFor)!;
  expect(n.pros).toContain("You want ZFS and jails built in");
  expect(n.cons).toEqual(["Desktop setup is manual and some Linux-only apps and drivers aren't available"]);
  expect(compareNotes("mint", notesFor)).toEqual(notesFor("mint"));
  expect(compareNotes("nope", notesFor)).toBeNull();
});
