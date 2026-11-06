import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DistroPicker } from "../src/components/DistroPicker";
import { PROFILES } from "../src/lib/picker-profiles";
import { encodeAnswers } from "../src/lib/picker-questions";

const distros = PROFILES.map((p, i) => ({ slug: p.key, name: p.key.toUpperCase(), rank: i + 1, rankTrend: null }));

beforeEach(() => window.history.replaceState(null, "", "/pick/"));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("shows one question at a time with progress, then results with a share link in the URL", async () => {
  const user = userEvent.setup();
  render(<DistroPicker distros={distros} />);
  expect(screen.getByRole("heading", { name: "Where are you coming from?" })).toBeInTheDocument();
  expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Windows" }));
  expect(screen.getByRole("heading", { name: "What's it mainly for?" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Everyday use/ }));
  await user.click(screen.getByRole("button", { name: "None or very little" }));
  // Beginners don't get the updates question; skip everything else.
  while (!screen.queryByRole("heading", { name: "Your best matches" })) {
    expect(screen.queryByRole("heading", { name: "How do you like updates?" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Skip this question" }));
  }
  expect(screen.getAllByText(/% match/).length).toBeGreaterThanOrEqual(3);
  expect(window.location.search).toMatch(/^\?a=\d+$/);
  expect(screen.getAllByRole("link", { name: "Official download" })[0]).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: /Switching from Windows/ })).toBeInTheDocument();
});

test("Back returns to the previous question", async () => {
  const user = userEvent.setup();
  render(<DistroPicker distros={distros} />);
  await user.click(screen.getByRole("button", { name: "Mac" }));
  await user.click(screen.getByRole("button", { name: /Back/ }));
  expect(screen.getByRole("heading", { name: "Where are you coming from?" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Mac" })).toHaveAttribute("aria-pressed", "true");
});

test("Why we ask reveals the explanation", async () => {
  const user = userEvent.setup();
  render(<DistroPicker distros={distros} />);
  await user.click(screen.getByRole("button", { name: "Why we ask" }));
  expect(screen.getByText(/feel familiar/)).toBeInTheDocument();
});

test("a shared link opens straight on the results, and the vote is anonymous", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  const code = encodeAnswers({ use: "gaming", level: "some", gpu: "nvidia" });
  window.history.replaceState(null, "", `/pick/?a=${code}`);
  const user = userEvent.setup();
  render(<DistroPicker distros={distros} />);
  await screen.findByRole("heading", { name: "Your best matches" });
  await user.click(screen.getByRole("button", { name: "Yes" }));
  await waitFor(() => expect(screen.getByText(/Votes are anonymous/)).toBeInTheDocument());
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe("/api/picker-feedback");
  const body = JSON.parse(init.body);
  expect(body).toMatchObject({ code, fit: true, website: "" });
  expect(Object.keys(body).sort()).toEqual(["code", "fit", "topKey", "website"]);
});

test("only good matches are listed beyond the top 3, and weak ones are counted, not shown", async () => {
  window.history.replaceState(null, "", `/pick/?a=${encodeAnswers({ use: "ai", level: "some", gpu: "nvidia", from: "windows", desktop: "windows-like", telemetry: "none" })}`);
  const user = userEvent.setup();
  render(<DistroPicker distros={distros} />);
  const toggle = await screen.findByRole("button", { name: /Show \d+ more good match/ });
  expect(screen.getByText(/less than half of your answers/)).toBeInTheDocument();
  expect(document.querySelector(".quiz-list")).toBeNull();
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const items = [...document.querySelectorAll(".quiz-list .sub")].map((e) => e.textContent!);
  expect(items.length).toBeGreaterThan(0);
  for (const t of items) expect(Number(t.match(/(\d+)%/)![1])).toBeGreaterThanOrEqual(50);
});
