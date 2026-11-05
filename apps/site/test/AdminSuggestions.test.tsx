import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminSuggestionsInner } from "../src/components/AdminSuggestions";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const admin = { id: 1, provider: "github", username: "boss", avatarUrl: null, role: "admin" };

function setup(me: unknown, rows: unknown[] = []) {
  let data = [...rows] as Array<Record<string, unknown>>;
  const calls: Array<[string, string, unknown]> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push([method, String(url), init?.body ? JSON.parse(String(init.body)) : undefined]);
    if (String(url).includes("/api/me")) return json(me);
    const m = String(url).match(/\/api\/admin\/suggestions\/(\d+)/);
    if (m && method === "PATCH") { const b = JSON.parse(String(init!.body)); data = data.map((r) => (r.id === Number(m[1]) ? { ...r, status: b.status } : r)); return json({ ok: true }); }
    if (m && method === "DELETE") { data = data.filter((r) => r.id !== Number(m[1])); return json({ ok: true }); }
    return json(data);
  }));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}><AdminSuggestionsInner /></QueryClientProvider>);
  return calls;
}

const row = (id: number, extra: Record<string, unknown> = {}) => ({
  id, kind: "correction", subject: "mint", message: `Message number ${id} with enough text.`, email: null,
  status: "new", createdAt: "2026-11-05T12:00:00Z", username: null, provider: null, ...extra,
});

test("non-admins get a clear message and no data request", async () => {
  const calls = setup({ ...admin, role: "user" });
  expect(await screen.findByText(/isn't an admin/)).toBeInTheDocument();
  expect(calls.some(([, u]) => u.includes("/api/admin/"))).toBe(false);
});

test("signed-out visitors are asked to sign in", async () => {
  setup(null);
  expect(await screen.findByText(/Sign in with an admin account/)).toBeInTheDocument();
});

test("tabs show counts; mark done moves an item out of New", async () => {
  const user = userEvent.setup();
  const calls = setup(admin, [row(1), row(2, { kind: "add-distro", email: "x@example.com" }), row(3, { status: "done" })]);
  const newTab = await screen.findByRole("tab", { name: /New 2/ });
  expect(newTab).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tab", { name: /Done 1/ })).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(2);
  // reply link only when there's an email
  const card2 = screen.getByRole("article", { name: "Suggestion 2" });
  expect(within(card2).getByRole("link", { name: "Reply" }).getAttribute("href")).toMatch(/^mailto:x@example.com\?subject=/);
  await user.click(within(screen.getByRole("article", { name: "Suggestion 1" })).getByRole("button", { name: "Mark done" }));
  await waitFor(() => expect(screen.getByRole("tab", { name: /New 1/ })).toBeInTheDocument());
  expect(calls).toContainEqual(["PATCH", "/api/admin/suggestions/1", { status: "done" }]);
});

test("delete asks for confirmation first", async () => {
  const user = userEvent.setup();
  const calls = setup(admin, [row(7)]);
  const card = await screen.findByRole("article", { name: "Suggestion 7" });
  await user.click(within(card).getByRole("button", { name: "Delete" }));
  expect(calls.some(([m]) => m === "DELETE")).toBe(false);
  await user.click(within(card).getByRole("button", { name: "Delete for good" }));
  await waitFor(() => expect(screen.getByText("Nothing new. All caught up.")).toBeInTheDocument());
  expect(calls).toContainEqual(["DELETE", "/api/admin/suggestions/7", undefined]);
});

test("search and type filter narrow the list", async () => {
  const user = userEvent.setup();
  setup(admin, [row(1, { message: "Fedora countme detail is outdated now." }), row(2, { kind: "idea", message: "Add an RSS feed for monthly reports." })]);
  await screen.findAllByRole("article");
  await user.type(screen.getByRole("searchbox", { name: "Search suggestions" }), "rss");
  expect(screen.getAllByRole("article")).toHaveLength(1);
  await user.clear(screen.getByRole("searchbox", { name: "Search suggestions" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Filter by type" }), "correction");
  expect(screen.getAllByRole("article").map((a) => a.getAttribute("aria-label"))).toEqual(["Suggestion 1"]);
});
