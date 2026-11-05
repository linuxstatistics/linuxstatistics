import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SponsorCard } from "../src/components/SponsorCard";

afterEach(cleanup);

test("empty slot is labelled and points to the sponsors page", () => {
  render(<SponsorCard sponsor={null} context="people about to install Linux" />);
  expect(screen.getByText("Sponsor")).toBeInTheDocument();
  expect(screen.getByText(/in front of people about to install Linux/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sponsor LinuxStatistics" })).toHaveAttribute("href", "/sponsors/");
});

test("a real sponsor is labelled and linked as sponsored", () => {
  render(<SponsorCard sponsor={{ name: "Acme", logoUrl: "/acme.png", href: "https://acme.test", tagline: "Linux laptops" }} />);
  const link = screen.getByRole("link", { name: /Acme/ });
  expect(link).toHaveAttribute("rel", "sponsored nofollow noopener");
  expect(link).toHaveAttribute("target", "_blank");
  expect(screen.getByText("Sponsor")).toBeInTheDocument();
});
