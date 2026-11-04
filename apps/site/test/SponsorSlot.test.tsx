import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SponsorSlot } from "../src/components/SponsorSlot";

afterEach(cleanup);

test("shows the house ad when there is no sponsor", () => {
  render(<SponsorSlot sponsor={null} />);
  expect(screen.getByText(/Sponsorships available/i)).toBeInTheDocument();
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
