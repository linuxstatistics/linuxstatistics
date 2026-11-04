import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../src/App";

function payloadFor(url: string): unknown {
  if (url.includes("/api/meta")) return { trackedDistros: 0, sources: [] };
  return [];
}

beforeEach(() => {
  global.fetch = vi.fn(async (input: RequestInfo | URL) =>
    new Response(JSON.stringify(payloadFor(String(input))), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("renders the brand and falls back to the List view without WebGL", async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>,
  );

  expect(screen.getByText("LinuxStatistics")).toBeInTheDocument();
  // jsdom has no WebGL, so the Galaxy toggle is hidden and no canvas is rendered.
  expect(screen.queryByRole("button", { name: "Galaxy" })).not.toBeInTheDocument();
  expect(document.querySelector("canvas")).toBeNull();
  // The List page renders (its search control is present).
  await waitFor(() => expect(screen.getByLabelText("Search distros")).toBeInTheDocument());
});
