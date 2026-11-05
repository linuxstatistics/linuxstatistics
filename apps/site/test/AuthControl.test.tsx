import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthControl } from "../src/components/AuthControl";

function renderControl() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AuthControl />
    </QueryClientProvider>,
  );
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("signed out: renders a sign-in trigger and provider options", async () => {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/me")) return new Response("{}", { status: 401 });
    if (url.includes("/api/auth/providers"))
      return new Response(JSON.stringify([{ slug: "github", displayName: "GitHub" }, { slug: "gitlab", displayName: "GitLab" }]), { status: 200, headers: { "content-type": "application/json" } });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;
  renderControl();
  await waitFor(() => expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument());
  screen.getByRole("button", { name: /sign in/i }).click();
  expect(await screen.findByText("Sign in with GitHub")).toBeInTheDocument();
  expect(screen.getByText("Sign in with GitLab")).toBeInTheDocument();
});

test("signed in: username opens an account menu with sign out", async () => {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/me"))
      return new Response(JSON.stringify({ id: 1, provider: "gitlab", username: "chris", avatarUrl: null, role: "user" }), { status: 200, headers: { "content-type": "application/json" } });
    return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  renderControl();
  const trigger = await screen.findByRole("button", { name: "Account menu for chris" });
  expect(trigger).toHaveTextContent("chris");
  // Sign out is inside the menu, not on the header.
  expect(screen.queryByRole("menuitem", { name: "Sign out" })).not.toBeInTheDocument();
  trigger.click();
  expect(await screen.findByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
  expect(screen.getByText("Signed in with GitLab")).toBeInTheDocument();
});
