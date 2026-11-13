import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AffiliateBlock } from "../src/components/AffiliateBlock";
import { affiliateProviders } from "../src/config/affiliate";

const demo = [
  { name: "DigitalOcean", href: "/api/go/digitalocean", blurb: "from $4/mo" },
  { name: "Vultr", href: "/api/go/vultr", blurb: "from $2.50/mo" },
];

afterEach(cleanup);

test("renders configured providers and a disclosure", () => {
  render(<AffiliateBlock providers={demo} />);
  expect(screen.getByText(/affiliate links/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /DigitalOcean/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Vultr/ })).toBeInTheDocument();
});

test("renders nothing when no providers are configured", () => {
  const { container } = render(<AffiliateBlock providers={[]} />);
  expect(container.firstChild).toBeNull();
});

test("links go through our counted redirect with sponsored rel and no Linode", () => {
  render(<AffiliateBlock providers={demo} />);
  const links = screen.getAllByRole("link");
  expect(links.map((l) => l.getAttribute("href"))).toEqual(["/api/go/digitalocean", "/api/go/vultr"]);
  for (const l of links) {
    expect(l).toHaveAttribute("target", "_blank");
    expect(l.getAttribute("rel")).toMatch(/sponsored/);
    expect(l.getAttribute("rel")).toMatch(/nofollow/);
  }
  expect(screen.queryByText(/Linode/)).toBeNull();
});

test("partners without a real referral link are not shown on the site", () => {
  expect(affiliateProviders).toEqual([]);
  const { container } = render(<AffiliateBlock />);
  expect(container.firstChild).toBeNull();
});
