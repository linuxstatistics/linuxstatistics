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

test("install pages stack headline then guide; one company on both tiers shows once", async () => {
  const { SponsorStack } = await import("../src/components/SponsorStack");
  const h = { name: "Tux Laptops", logoUrl: "/h.png", href: "https://tux.test", tagline: "Laptops" };
  const g = { name: "Backup Co", logoUrl: "/g.png", href: "https://backup.test", tagline: "Backups" };
  const names = () => screen.queryAllByRole("img").map((i) => i.getAttribute("alt"));

  render(<SponsorStack headline={h} guide={g} />);
  expect(names()).toEqual(["Tux Laptops", "Backup Co"]);
  cleanup();

  render(<SponsorStack headline={h} guide={null} />);
  expect(names()).toEqual(["Tux Laptops"]);
  cleanup();

  render(<SponsorStack headline={null} guide={null} />);
  expect(screen.getAllByRole("complementary", { name: "Sponsor" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Sponsor LinuxStatistics" })).toBeInTheDocument();
  cleanup();

  render(<SponsorStack headline={null} guide={g} />);
  expect(screen.getAllByRole("complementary", { name: "Sponsor" })).toHaveLength(2);
  expect(names()).toEqual(["Backup Co"]);
  cleanup();

  render(<SponsorStack headline={h} guide={{ ...h, name: "Tux Laptops (install)", tagline: "Preinstalled Linux" }} />);
  expect(names()).toEqual(["Tux Laptops (install)"]);
});
