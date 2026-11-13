import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BeginnerPicker } from "../src/components/BeginnerPicker";

afterEach(() => { cleanup(); history.replaceState(null, "", "/pick/"); });
const distros = ["mint", "ubuntu", "zorin", "bazzite"].map((slug) => ({ slug, name: slug, rank: null }));
test("pointer selection auto-advances to a guide-first result and keeps heading focus", async () => {
  const user = userEvent.setup();
  render(<BeginnerPicker distros={distros} staticPairs={[]} />);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Choose an answer");
  await user.click(screen.getByLabelText("Windows"));
  await user.click(screen.getByLabelText("A regular 64-bit PC"));
  await user.click(screen.getByLabelText("Web, email and everyday tasks"));
  expect(screen.getByRole("heading", { name: "A good place to start: mint" })).toHaveFocus();
  expect(screen.getByRole("link", { name: "Getting started with mint" })).toHaveAttribute("href", "/switch/getting-started/?distro=mint");
  await user.click(screen.getByRole("button", { name: "Edit answers" }));
  expect(screen.getByLabelText("Windows")).toBeChecked();
});

test("keyboard selection waits for Continue rather than advancing on arrow or Space", async () => {
  const user = userEvent.setup();
  render(<BeginnerPicker distros={distros} staticPairs={[]} />);
  screen.getByLabelText("Windows").focus();
  await user.keyboard(" ");
  expect(screen.getByLabelText("Windows")).toBeChecked();
  expect(screen.getByRole("heading", { name: "What do you use now?" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("heading", { name: "Which computer will run Linux?" })).toHaveFocus();
});

test("Apple Silicon shared results show model guidance without an ordinary PC download", () => {
  history.replaceState(null, "", "/pick/?v=1&origin=mac&machine=apple&purpose=everyday");
  render(<BeginnerPicker distros={distros} staticPairs={[]} />);
  expect(screen.getByRole("heading", { name: "Check your Mac with Asahi" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Official download" })).not.toBeInTheDocument();
});

test("partial URL resumes at the next question, with unsure choices last", () => {
  history.replaceState(null, "", "/pick/?v=1&origin=windows&machine=pc");
  render(<BeginnerPicker distros={distros} staticPairs={[]} />);
  expect(screen.getByRole("heading", { name: "What will you mainly use it for?" })).toBeInTheDocument();
  expect(screen.getAllByRole("radio").at(-1)).toHaveAccessibleName("Something else / not sure");
});

test("browser history restores a prior question rather than jumping to results", async () => {
  const user = userEvent.setup();
  render(<BeginnerPicker distros={distros} staticPairs={[]} />);
  await user.click(screen.getByLabelText("Windows"));
  await user.click(screen.getByLabelText("A regular 64-bit PC"));
  act(() => {
    history.replaceState({ beginnerStep: 1, beginnerDone: false }, "", "/pick/?v=1&origin=windows");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(screen.getByRole("heading", { name: "Which computer will run Linux?" })).toBeInTheDocument();
});
