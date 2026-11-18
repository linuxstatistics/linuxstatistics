import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PROFILES } from "../src/lib/picker-profiles";
import { USES, primaryUses, useFit, useFits, withoutRepeats } from "../src/lib/use-fit";
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

test("tabs show only the uses a distro is built for, plus the one the quiz linked to", async () => {
  const fedora = prof("fedora");
  const primary = primaryUses(fedora);
  expect(primary).toEqual(USES.map((u) => u.use).filter((u) => fedora.uses.includes(u)));
  expect(primary).not.toContain("gaming");
  render(<UseFitTabs name="Fedora" fits={useFits(fedora)} primary={primary} />);
  expect(screen.getAllByRole("tab")).toHaveLength(primary.length);
  expect(screen.queryByRole("tab", { name: "Gaming" })).not.toBeInTheDocument();
  cleanup();
  window.history.replaceState(null, "", "/distro/fedora/?for=gaming");
  render(<UseFitTabs name="Fedora" fits={useFits(fedora)} primary={primary} />);
  expect(await screen.findByRole("tab", { name: "Gaming" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getAllByRole("tab")).toHaveLength(primary.length + 1);
});

test("tab lines that repeat the general pros and cons are dropped, never emptying a panel", () => {
  const fits = withoutRepeats(useFits(prof("mint")), ["Windows-style Cinnamon desktop that feels familiar"]);
  expect(fits.find((f) => f.use === "everyday")!.pros).not.toContain("Windows-style desktop that feels familiar");
  const only = [{ use: "gaming" as const, label: "Gaming", verdict: "ok" as const, pros: ["Feels familiar"], cons: [] }];
  expect(withoutRepeats(only, ["Feels familiar to everyone"])[0]!.pros).toEqual(["Feels familiar"]);
});

test("hand-written notes become an Overall tab first; ?for= still opens its use", async () => {
  const user = userEvent.setup();
  const fedora = prof("fedora");
  const overall = { key: "fedora", pros: ["Hand-written pro"], cons: ["Hand-written con"] };
  render(<UseFitTabs name="Fedora" fits={useFits(fedora)} primary={primaryUses(fedora)} overall={overall} />);
  expect(screen.getAllByRole("tab")[0]).toHaveTextContent("Overall");
  expect(screen.getByRole("tab", { name: "Overall" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Hand-written pro")).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Programming" }));
  expect(screen.getByText("Hand-written pro")).not.toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Overall" }));
  expect(window.location.search).toBe("");
  cleanup();
  window.history.replaceState(null, "", "/distro/fedora/?for=ai");
  render(<UseFitTabs name="Fedora" fits={useFits(fedora)} primary={primaryUses(fedora)} overall={overall} />);
  expect(screen.getByRole("tab", { name: "AI & Local LLMs" })).toHaveAttribute("aria-selected", "true");
});
