import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiamiChecker } from "../src/components/MiamiChecker";

beforeEach(() => window.history.replaceState(null, "", "/can-i-run/gta-vi/"));
afterEach(cleanup);

test("asks for all three parts before giving a verdict", () => {
  render(<MiamiChecker />);
  expect(screen.getByText(/Choose your graphics card, processor and memory/)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
});

test("picking all three shows the verdict, the Linux box and a shareable address", async () => {
  const user = userEvent.setup();
  render(<MiamiChecker />);
  await user.selectOptions(screen.getByLabelText("Graphics card"), "GTX 1060 6 GB");
  await user.selectOptions(screen.getByLabelText("Processor"), "Ryzen 5 5600X");
  await user.selectOptions(screen.getByLabelText("Memory (RAM)"), "16");
  expect(screen.getByRole("heading", { level: 2, name: "Meets the RDR2 recommended spec" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 3, name: "On Linux" })).toBeInTheDocument();
  expect(screen.getByText(/NVIDIA's 580 driver is the last/)).toBeInTheDocument();
  expect(window.location.hash).toBe("#gpu=nvidia-gtx-1060-6-gb&cpu=ryzen-5-5600x&ram=16");
  expect(window.location.search).toBe("");
});

test("a shared address restores the result", async () => {
  window.history.replaceState(null, "", "/can-i-run/gta-vi/#gpu=nvidia-rtx-4070-12-gb&cpu=ryzen-5-5600x&ram=32");
  render(<MiamiChecker />);
  expect(await screen.findByRole("heading", { level: 2, name: "PS5-class or better" })).toBeInTheDocument();
});
