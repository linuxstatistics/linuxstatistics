import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailAction } from "../src/components/EmailAction";

beforeEach(() => { window.history.replaceState(null, "", "/email/confirm/?t=example-confirm-link"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test("does nothing on load; confirms only when the button is pressed", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<EmailAction kind="confirm" />);
  await waitFor(() => expect(window.location.search).toBe(""));
  expect(fetchMock).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole("button", { name: /confirm my subscription/i }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/you're subscribed/i));
  expect(fetchMock).toHaveBeenCalledWith("/api/email-signups/confirm", expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "example-confirm-link" }) }));
});

test("an expired link says so", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false, reason: "expired" }) }));
  render(<EmailAction kind="confirm" />);
  await userEvent.setup().click(await screen.findByRole("button", { name: /confirm/i }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/expired/i));
});

test("a link without a token shows the problem, no button", async () => {
  window.history.replaceState(null, "", "/email/unsubscribe/");
  render(<EmailAction kind="unsubscribe" />);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/isn't valid/i));
  expect(screen.queryByRole("button")).toBeNull();
});

test("unsubscribe posts to the unsubscribe route", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  render(<EmailAction kind="unsubscribe" />);
  await userEvent.setup().click(await screen.findByRole("button", { name: /^unsubscribe$/i }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/unsubscribed/i));
  expect(fetchMock.mock.calls[0]![0]).toBe("/api/email-signups/unsubscribe");
});
