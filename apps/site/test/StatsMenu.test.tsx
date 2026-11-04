import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsMenu } from "../src/components/StatsMenu";

afterEach(() => cleanup());

function renderMenu() {
  return render(
    <StatsMenu
      items={[]}
      marketShare={[{ capturedAt: "2026-01-01T00:00:00.000Z", region: "global", platform: "linux", sharePct: 4.5 }]}
    />,
  );
}

test("keeps the stats panel collapsed until opened", () => {
  const { container } = renderMenu();
  expect(screen.getByRole("button", { name: "Summary stats" })).toHaveAttribute("aria-expanded", "false");
  expect(container.querySelector(".stats-menu")).toHaveAttribute("data-open", "false");
});

test("expands the stats panel on click", async () => {
  const user = userEvent.setup();
  const { container } = renderMenu();
  await user.click(screen.getByRole("button", { name: "Summary stats" }));
  expect(screen.getByRole("button", { name: "Summary stats" })).toHaveAttribute("aria-expanded", "true");
  expect(container.querySelector(".stats-menu")).toHaveAttribute("data-open", "true");
  expect(screen.getByText("Linux desktop share")).toBeInTheDocument();
  expect(screen.getByText("4.50%")).toBeInTheDocument();
});
