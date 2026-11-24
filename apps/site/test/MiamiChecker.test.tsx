import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiamiChecker } from "../src/components/MiamiChecker";
import { EVIDENCE, REVIEWER_NOTE } from "../src/lib/miami-status";

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
  expect(await screen.findByRole("heading", { level: 2, name: "PS5 and Series X-class or better" })).toBeInTheDocument();
});

test("before a verdict, a dim five-step ladder is shown and hidden from screen readers", () => {
  const { container } = render(<MiamiChecker />);
  const ladder = container.querySelector(".miami-ladder");
  expect(ladder).not.toBeNull();
  expect(ladder).toHaveAttribute("aria-hidden", "true");
  expect(ladder!.querySelectorAll("li")).toHaveLength(5);
  expect(ladder!.querySelectorAll('li[data-state="ahead"]')).toHaveLength(5);
  expect(container.querySelector(".miami-result")).toHaveAttribute("data-empty", "true");
});

test("once there is a verdict the result is no longer marked empty", async () => {
  window.history.replaceState(null, "", "/can-i-run/gta-vi/#gpu=nvidia-gtx-1060-6-gb&cpu=ryzen-5-5600x&ram=16");
  const { container } = render(<MiamiChecker />);
  await screen.findByRole("heading", { level: 2, name: "Meets the RDR2 recommended spec" });
  expect(container.querySelector(".miami-result")).not.toHaveAttribute("data-empty");
});

test("pasting a share link into an open page applies its picks", async () => {
  render(<MiamiChecker />);
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  await act(async () => {
    window.history.replaceState(null, "", "/can-i-run/gta-vi/#gpu=nvidia-rtx-4070-12-gb&cpu=ryzen-5-5600x&ram=32");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(await screen.findByRole("heading", { level: 2, name: "PS5 and Series X-class or better" })).toBeInTheDocument();
});

test("in-page links (to a report or the checklist) leave the result alone", async () => {
  window.history.replaceState(null, "", "/can-i-run/gta-vi/#gpu=nvidia-rtx-4070-12-gb&cpu=ryzen-5-5600x&ram=32");
  render(<MiamiChecker />);
  await screen.findByRole("heading", { level: 2, name: "PS5 and Series X-class or better" });
  await act(async () => {
    window.history.replaceState(null, "", "/can-i-run/gta-vi/#ev-press-2026-11-24-takedowns");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(screen.getByRole("heading", { level: 2, name: "PS5 and Series X-class or better" })).toBeInTheDocument();
});

test("a verdict shows the reviewer estimates note, linked to a real report, and the empty state does not", async () => {
  render(<MiamiChecker />);
  expect(screen.queryByRole("heading", { level: 3, name: "What reviewers estimate" })).toBeNull();
  window.history.replaceState(null, "", "/can-i-run/gta-vi/#gpu=nvidia-gtx-1060-6-gb&cpu=ryzen-5-5600x&ram=16");
  cleanup();
  render(<MiamiChecker />);
  expect(await screen.findByRole("heading", { level: 3, name: "What reviewers estimate" })).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "Read the report" });
  expect(link).toHaveAttribute("href", `#ev-${REVIEWER_NOTE.evidenceId}`);
  expect(EVIDENCE.some((e) => e.id === REVIEWER_NOTE.evidenceId)).toBe(true);
});

test("the reviewer note does not change the verdict", async () => {
  window.history.replaceState(null, "", "/can-i-run/gta-vi/#gpu=nvidia-gtx-1060-6-gb&cpu=ryzen-5-5600x&ram=16");
  render(<MiamiChecker />);
  expect(await screen.findByRole("heading", { level: 2, name: "Meets the RDR2 recommended spec" })).toBeInTheDocument();
});
