import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AffiliateBlock } from "../src/components/AffiliateBlock";

afterEach(cleanup);

test("renders configured providers and a disclosure", () => {
  render(<AffiliateBlock />);
  expect(screen.getByText(/affiliate links/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /DigitalOcean/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Vultr/ })).toBeInTheDocument();
});

test("renders nothing when no providers are configured", () => {
  const { container } = render(<AffiliateBlock providers={[]} />);
  expect(container.firstChild).toBeNull();
});
