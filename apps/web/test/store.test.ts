import { afterEach, expect, test } from "vitest";
import { useStore } from "../src/store";

afterEach(() => {
  useStore.setState({ view: "galaxy", selectedSlug: null });
});

test("switching views clears the selected distro (closes the detail panel)", () => {
  useStore.getState().setSelected("ubuntu");
  expect(useStore.getState().selectedSlug).toBe("ubuntu");

  useStore.getState().setView("list");
  expect(useStore.getState().selectedSlug).toBeNull();
  expect(useStore.getState().view).toBe("list");
});

test("setSelected updates the selection without changing the view", () => {
  useStore.getState().setSelected("fedora");
  expect(useStore.getState().selectedSlug).toBe("fedora");
  expect(useStore.getState().view).toBe("galaxy");
});
