import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestForm } from "../src/components/SuggestForm";
import { SupportBlock } from "../src/components/SupportBlock";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("sends a suggestion and thanks the user", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(<SuggestForm />);
  await user.click(screen.getByLabelText("Fix wrong or outdated information"));
  await user.type(screen.getByLabelText("Which page or distro"), "mint");
  await user.type(screen.getByLabelText("Your suggestion"), "Mint 22 is based on Ubuntu 24.04 now.");
  await user.click(screen.getByRole("button", { name: "Send suggestion" }));
  await waitFor(() => expect(screen.getByText("Thanks, we've got it.")).toBeInTheDocument());
  const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
  expect(body).toMatchObject({ kind: "correction", subject: "mint", website: "" });
});

test("asks for a longer message before sending", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(<SuggestForm />);
  await user.type(screen.getByLabelText("Your suggestion"), "too short");
  await user.click(screen.getByRole("button", { name: "Send suggestion" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/at least a sentence/);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("support block shows links, and crypto addresses only when asked", async () => {
  const user = userEvent.setup();
  render(
    <SupportBlock
      links={[{ name: "Ko-fi", href: "https://ko-fi.com/x", note: "one-off tip" }]}
      crypto={[{ name: "Monero", scheme: "monero", address: "48abc" }]}
    />,
  );
  expect(screen.getByRole("link", { name: "Ko-fi" })).toHaveAttribute("target", "_blank");
  expect(screen.queryByText("48abc")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Tip with crypto" }));
  expect(screen.getByText("48abc")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copy Monero address" })).toBeInTheDocument();
});
