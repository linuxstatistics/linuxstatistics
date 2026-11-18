import "@testing-library/jest-dom/vitest";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SCREENSHOTS } from "../src/lib/screenshots";
import { DistroScreenshot } from "../src/components/DistroScreenshot";

afterEach(cleanup);

const dir = resolve(__dirname, "../public/shots");

test("every manifest entry has both files, a Commons source, a license and a credit", () => {
  for (const [slug, s] of Object.entries(SCREENSHOTS)) {
    for (const w of [640, 1280]) expect(existsSync(resolve(dir, `${slug}-${w}.webp`)), `${slug}-${w}`).toBe(true);
    expect(s.source, slug).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(s.license, slug).toMatch(/^(GPL|CC0|CC BY(-SA)? \d\.\d)$/);
    expect(s.author.length, slug).toBeGreaterThan(1);
    expect(s.width).toBeGreaterThan(0);
  }
});

test("every file in public/shots has a manifest entry", () => {
  for (const f of readdirSync(dir)) {
    const slug = f.replace(/-(640|1280)\.webp$/, "");
    expect(SCREENSHOTS[slug], f).toBeDefined();
  }
});

test("renders with credit and size set; nothing without a screenshot", () => {
  const { container } = render(<DistroScreenshot slug="ubuntu" name="Ubuntu" />);
  const img = container.querySelector("img")!;
  expect(img.getAttribute("width")).toBe("640");
  expect(img.getAttribute("height")).toBeTruthy();
  expect(img.getAttribute("loading")).toBe("lazy");
  expect(screen.getByRole("link", { name: "Wikimedia Commons" })).toHaveAttribute("href", SCREENSHOTS.ubuntu!.source);
  const empty = render(<DistroScreenshot slug="no-such-distro" name="None" />);
  expect(empty.container.innerHTML).toBe("");
});

test("stale screenshots say so in the caption", () => {
  render(<DistroScreenshot slug="nixos" name="NixOS" />);
  expect(screen.getByText(/older release/)).toBeInTheDocument();
});
