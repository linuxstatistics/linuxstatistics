import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatsMenu } from "../src/components/StatsMenu";

beforeEach(() => {
  global.fetch = vi.fn(async () =>
    new Response(JSON.stringify([]), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderMenu() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <StatsMenu />
    </QueryClientProvider>,
  );
}

test("keeps the stats panel collapsed until opened", () => {
  const { container } = renderMenu();
  // The accordion keeps the panel mounted but collapsed via data-open/aria-expanded.
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
});
