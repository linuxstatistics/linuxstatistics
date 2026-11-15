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

test("tiers: one headline and one guide sponsor, supporters capped, expired terms dropped", async () => {
  const { activeSponsors, SUPPORTER_LIMIT } = await import("../src/config/sponsor");
  const s = (name: string, tier?: "headline" | "guide" | "supporter", endsOn?: string) => ({ name, logoUrl: "/x.png", href: `https://${name}.test`, tagline: "x", tier, endsOn });
  const now = new Date("2026-12-15T12:00:00Z");
  const all = [
    s("old", "headline", "2026-12-01"),
    s("untagged"),
    s("second-headline", "headline"),
    s("guide", "guide"),
    ...Array.from({ length: SUPPORTER_LIMIT + 2 }, (_, i) => s(`sup${i}`, "supporter")),
  ];
  const a = activeSponsors(all, now);
  expect(a.headline?.name).toBe("untagged");
  expect(a.guide?.name).toBe("guide");
  expect(a.supporters).toHaveLength(SUPPORTER_LIMIT);
  expect(activeSponsors([], now)).toEqual({ headline: null, guide: null, supporters: [] });
});

test("supporter row is hidden when empty and links logos as sponsored", async () => {
  const { SupporterRow } = await import("../src/components/SupporterRow");
  const { container } = render(<SupporterRow supporters={[]} />);
  expect(container).toBeEmptyDOMElement();
  render(<SupporterRow supporters={[{ name: "Tux Host", logoUrl: "/t.png", href: "https://tux.test", tagline: "" }]} />);
  expect(screen.getByRole("region", { name: "Supported by" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Tux Host/ })).toHaveAttribute("rel", "sponsored nofollow noopener");
});
