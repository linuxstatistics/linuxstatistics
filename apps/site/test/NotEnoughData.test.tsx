import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProsConsPair } from "../src/components/ProsCons";
import { PairVerdict } from "../src/components/PairVerdict";

afterEach(cleanup);

test("a side without notes shows a not-enough-data card instead of nothing", () => {
  render(<ProsConsPair a={{ name: "Mint", notes: { key: "mint", pros: ["Easy"], cons: ["Older apps"] } as never }} b={{ name: "Winux", notes: null }} />);
  expect(screen.getByText("Easy")).toBeInTheDocument();
  expect(screen.getByText("Not enough data")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Suggest some" })).toHaveAttribute("href", expect.stringContaining("/suggest/"));
});

test("a verdict side with no reasons says so", () => {
  render(<PairVerdict v={{ a: { name: "Mint", reasons: ["you're new to Linux"] }, b: { name: "Winux", reasons: [], empty: "unknown" } }} />);
  expect(screen.getByText(/We haven't profiled Winux yet/)).toBeInTheDocument();
});

test("a profiled side with nothing distinct shows its summary, not a no-data card", () => {
  render(<PairVerdict v={{ a: { name: "Mint", reasons: ["x"] }, b: { name: "Zorin", reasons: [], empty: "same", blurb: "Polished desktop." } }} />);
  expect(screen.getByText("Zorin suits the same people")).toBeInTheDocument();
  expect(screen.queryByText(/Not enough data/)).not.toBeInTheDocument();
});

test("verdict cards link to the distro page, and to the install guide when there is one", () => {
  render(
    <PairVerdict
      v={{ a: { name: "Mint", reasons: ["you're new to Linux"] }, b: { name: "Arch", reasons: ["you want full control"] } }}
      links={{ a: { href: "/distro/mint/", guide: "/switch/getting-started/?distro=mint" }, b: { href: "/distro/arch/" } }}
    />,
  );
  expect(screen.getByRole("link", { name: "Mint in detail" })).toHaveAttribute("href", "/distro/mint/");
  expect(screen.getByRole("link", { name: "Getting started with Mint" })).toHaveAttribute("href", "/switch/getting-started/?distro=mint");
  expect(screen.getByRole("link", { name: "Arch in detail" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Getting started with Arch" })).not.toBeInTheDocument();
});

test("an unprofiled side still shows what we know and where to go", () => {
  render(
    <PairVerdict
      v={{ a: { name: "Bluefin", reasons: ["you're new to Linux"] }, b: { name: "openmamba", reasons: [], empty: "unknown" } }}
      links={{
        a: { href: "/distro/bluefin/" },
        b: { href: "/distro/openmamba/", summary: "openmamba is an Italian Linux distribution.", website: "https://openmamba.org/", slug: "openmamba" },
      }}
    />,
  );
  expect(screen.getByText("openmamba is an Italian Linux distribution.")).toBeInTheDocument();
  expect(screen.queryByText(/first released/i)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "openmamba in detail" })).toHaveAttribute("href", "/distro/openmamba/");
  expect(screen.getByRole("link", { name: /Website/ })).toHaveAttribute("href", "https://openmamba.org/");
  expect(screen.getByRole("link", { name: /Tell us who it suits/ })).toHaveAttribute("href", "/suggest/?kind=correction&subject=openmamba");
});
