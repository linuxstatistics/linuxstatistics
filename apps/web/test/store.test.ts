import { afterEach, expect, test } from "vitest";
import { useStore } from "../src/store";

afterEach(() => {
  useStore.setState({ selectedSlug: null });
});

test("setSelected opens and clears the selected distro", () => {
  useStore.getState().setSelected("fedora");
  expect(useStore.getState().selectedSlug).toBe("fedora");
  useStore.getState().setSelected(null);
  expect(useStore.getState().selectedSlug).toBeNull();
});
