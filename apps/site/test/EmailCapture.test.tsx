import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmailCapture } from "../src/components/EmailCapture";

function withClient(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("submitting a valid email posts and shows confirmation", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(withClient(<EmailCapture />));
  await user.type(screen.getByLabelText(/State of Linux Distros/i), "me@example.com");
  await user.click(screen.getByRole("button", { name: /subscribe/i }));
  await waitFor(() => expect(screen.getByText(/you're on the list/i)).toBeInTheDocument());
  expect(fetchMock).toHaveBeenCalledOnce();
});

test("an invalid email shows an error and sends no request", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(withClient(<EmailCapture />));
  await user.type(screen.getByLabelText(/State of Linux Distros/i), "nope");
  await user.click(screen.getByRole("button", { name: /subscribe/i }));
  expect(screen.getByRole("alert")).toHaveTextContent(/doesn't look like an email address/i);
  const input = screen.getByLabelText(/State of Linux Distros/i);
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute("aria-describedby", screen.getByRole("alert").id);
  expect(fetchMock).not.toHaveBeenCalled();
});
