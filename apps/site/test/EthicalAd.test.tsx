import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EthicalAd } from "../src/components/EthicalAd";
import { ethicalAds } from "../src/config/ads";

afterEach(cleanup);

test("ads are off by default and render nothing", () => {
  expect(ethicalAds.enabled).toBe(false);
  const { container } = render(<EthicalAd placement="distro" />);
  expect(container.firstChild).toBeNull();
});

test("renders nothing when enabled without a publisher id", () => {
  const { container } = render(<EthicalAd placement="distro" config={{ ...ethicalAds, enabled: true, publisherId: "" }} />);
  expect(container.firstChild).toBeNull();
});

test("when enabled it is labelled and carries the publisher id", () => {
  render(<EthicalAd placement="compare" config={{ ...ethicalAds, enabled: true, publisherId: "linuxstatistics" }} />);
  expect(screen.getByText("Ad")).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: /advertisement/i })).toBeInTheDocument();
  expect(document.getElementById("ea-compare")).toHaveAttribute("data-ea-publisher", "linuxstatistics");
});
