import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PROFILES } from "../src/lib/picker-profiles";
import { USES, useFit, useFits } from "../src/lib/use-fit";
import { QUESTIONS } from "../src/lib/picker-questions";
import { UseFitTabs } from "../src/components/UseFitTabs";

const prof = (k: string) => PROFILES.find((p) => p.key === k)!;
afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });

test("uses follow the quiz's order", () => {
  const quiz = QUESTIONS.find((q) => q.id === "use")!.options.map(([v]) => v);
  expect(USES.map((u) => u.use)).toEqual(quiz);
});

test("every profile gets a verdict and at least one line for every use, no em dashes", () => {
  for (const p of PROFILES) {
    for (const f of useFits(p)) {
      expect(f.pros.length + f.cons.length, `${p.key}/${f.use}`).toBeGreaterThan(0);
      expect([...f.pros, ...f.cons].join(" ")).not.toMatch(/[—–]/);
    }
  }
});

test("AI: Fedora has CUDA and ROCm, Pop!_OS has no ROCm, Trisquel is a poor fit", () => {
  const f = useFit(prof("fedora"), "ai");
  expect(f.verdict).toBe("good");
  expect(f.pros).toEqual(expect.arrayContaining(["CUDA available from NVIDIA's or the distro's own packages", "AMD ROCm supported or packaged"]));
  expect(useFit(prof("popos"), "ai").cons).toContain("AMD ROCm isn't officially supported");
  expect(useFit(prof("trisquel"), "ai").verdict).toBe("poor");
});

test("tagged uses are good fits; heavy distros are poor for old computers", () => {
  expect(useFit(prof("bazzite"), "gaming").verdict).toBe("good");
  expect(useFit(prof("qubes"), "old-hw").verdict).toBe("poor");
  expect(useFit(prof("antix"), "old-hw").pros).toContain("Runs in about 512 MB of RAM");
});

test("the tabs open on ?for= from the quiz and switch on click", async () => {
  window.history.replaceState(null, "", "/distro/fedora/?for=ai");
  const user = userEvent.setup();
  render(<UseFitTabs name="Fedora" fits={useFits(prof("fedora"))} />);
  expect(screen.getByRole("tab", { name: "AI & Local LLMs" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText(/CUDA available/)).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Gaming" }));
  expect(screen.getByRole("tab", { name: "Gaming" })).toHaveAttribute("aria-selected", "true");
  expect(window.location.search).toBe("?for=gaming");
});
