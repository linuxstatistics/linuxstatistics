import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { quizCompletionInputSchema, switchReportInputSchema } from "@linux-statistics/shared";
import { _resetQuizCount, beginnerCode, countQuiz } from "../src/lib/quiz-count";
import { QuizCountNote } from "../src/components/QuizCountNote";
import { SwitchReport } from "../src/components/SwitchReport";

const ok = () => vi.fn(async () => new Response(null, { status: 204 }));
let fetchMock: ReturnType<typeof ok>;

beforeEach(() => {
  _resetQuizCount();
  fetchMock = ok();
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "globalPrivacyControl", { value: undefined, configurable: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("the short quiz code is the answers in question order, and the API accepts it", () => {
  const code = beginnerCode({ origin: "windows", machine: "pc", purpose: "gaming", gpu: "amd" });
  expect(code).toBe("windows.pc.gaming..amd");
  expect(quizCompletionInputSchema.safeParse({ quiz: "start", code, topKey: "bazzite", token: crypto.randomUUID() }).success).toBe(true);
});

test("a quiz is sent once per visit, with a fresh token", async () => {
  const t = await countQuiz("pick", "1213", "mint");
  expect(t).toMatch(/^[0-9a-f-]{36}$/);
  expect(await countQuiz("pick", "1213", "mint")).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
  expect(quizCompletionInputSchema.safeParse(body).success).toBe(true);
});

test("Global Privacy Control sends nothing", async () => {
  Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
  expect(await countQuiz("pick", "1", "mint")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("a shared results link isn't counted and shows no note", () => {
  render(<QuizCountNote quiz="pick" code="1213" topKey="mint" fresh={false} />);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByText(/counted this quiz/)).toBeNull();
});

test("a finished quiz says it was counted and can be taken back", async () => {
  render(<QuizCountNote quiz="pick" code="1213" topKey="mint" fresh />);
  const undo = await screen.findByRole("button", { name: "Don't count my answers" });
  fireEvent.click(undo);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
  expect(url).toMatch(/^\/api\/quiz-completions\/[0-9a-f-]{36}$/);
  expect(init.method).toBe("DELETE");
  expect(screen.getByText(/This quiz isn't counted/)).toBeInTheDocument();
});

test("the switch card needs an origin, sends a valid report and thanks the visitor", async () => {
  render(<SwitchReport page="distro" nowUsing="mint" distros={[{ slug: "mint", name: "Linux Mint", rank: 1 }]} />);
  const send = screen.getByRole("button", { name: "Count me in" });
  expect(send).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Windows" }));
  fireEvent.click(send);
  await screen.findByText(/Thanks for telling us/);
  const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
  expect(body).toMatchObject({ cameFrom: "windows", nowUsing: "mint", page: "distro" });
  expect(switchReportInputSchema.safeParse(body).success).toBe(true);
});

test("the compact switch report is a one-line prompt until opened", async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  render(<SwitchReport page="distro" compact nowUsing="mint" distros={[{ slug: "mint", name: "Linux Mint", rank: 1 }]} />);
  expect(screen.queryByRole("heading", { name: /help you switch/ })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Tell us where you came from" }));
  expect(screen.getByRole("heading", { name: /help you switch/ })).toBeInTheDocument();
});
