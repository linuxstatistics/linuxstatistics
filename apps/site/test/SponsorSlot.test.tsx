import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SponsorSlot } from "../src/components/SponsorSlot";

afterEach(cleanup);

test("shows the house ad when there is no sponsor", () => {
  render(<SponsorSlot sponsor={null} />);
  expect(screen.getByText(/Sponsorships available/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Sponsorships available/i })).toHaveAttribute("href", "/sponsors/");
});

test("shows the sponsor when one is set", () => {
  render(
    <SponsorSlot
      sponsor={{ name: "Acme", logoUrl: "/acme.png", href: "https://acme.test", tagline: "We host Linux" }}
    />,
  );
  expect(screen.getByRole("link", { name: /Acme/ })).toHaveAttribute("href", "https://acme.test");
  expect(screen.getByAltText("Acme")).toBeInTheDocument();
});

test("sponsor term dates decide whether the sponsor is active", async () => {
  const { sponsorIsActive } = await import("../src/config/sponsor");
  const s = { name: "Acme", logoUrl: "/a.png", href: "https://acme.test", tagline: "x", startsOn: "2026-12-01", endsOn: "2027-02-28" };
  expect(sponsorIsActive(s, new Date("2026-11-30T23:59:59Z"))).toBe(false);
  expect(sponsorIsActive(s, new Date("2026-12-01T00:00:00Z"))).toBe(true);
  expect(sponsorIsActive(s, new Date("2027-02-28T23:00:00Z"))).toBe(true);
  expect(sponsorIsActive(s, new Date("2027-03-01T00:00:00Z"))).toBe(false);
  expect(sponsorIsActive({ ...s, startsOn: undefined, endsOn: undefined }, new Date("2030-01-01T00:00:00Z"))).toBe(true);
  expect(sponsorIsActive(null)).toBe(false);
});
