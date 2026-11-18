import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HardwareNotes } from "../src/components/HardwareNotes";
import { hardwareHeading, hardwareRisks } from "../src/lib/hardware-notes";

afterEach(cleanup);

test("no specific risk means no warning box", () => {
  expect(hardwareRisks({})).toEqual([]);
  expect(hardwareRisks({ gpu: "nvidia", wifi: "unsure" })).toEqual([]);
  expect(hardwareRisks({ wifi: "intel", fossOnly: true })).toEqual([]);
});

test("each real risk is named once", () => {
  expect(hardwareRisks({ gpu: "nvidia-old" })).toEqual(["old-nvidia"]);
  expect(hardwareRisks({ wifi: "broadcom" })).toEqual(["wifi"]);
  expect(hardwareRisks({ wifi: "realtek" })).toEqual(["wifi"]);
  expect(hardwareRisks({ intelMac: true })).toEqual(["intel-mac", "wifi"]);
  // Free-software-only distros leave out Wi-Fi firmware, so an unknown chip is a risk there.
  expect(hardwareRisks({ fossOnly: true })).toEqual(["wifi"]);
  expect(hardwareRisks({ fossOnly: true, desktop: false })).toEqual([]);
});

test("headings say what to check", () => {
  expect(hardwareHeading(["old-nvidia"])).toBe("Your older NVIDIA card");
  expect(hardwareHeading(["wifi"])).toBe("Your Wi-Fi chip");
  expect(hardwareHeading(["intel-mac", "wifi"])).toBe("Your Intel Mac");
  expect(hardwareHeading(["old-nvidia", "wifi"])).toBe("Check these before installing");
});

test("without a risk only a one-line live-USB tip shows, and nothing for servers and boards", () => {
  const { container, rerender } = render(<HardwareNotes risks={[]} />);
  expect(screen.queryByRole("heading")).toBeNull();
  expect(screen.getByText(/Try it from a live USB first/)).toBeInTheDocument();
  rerender(<HardwareNotes risks={[]} liveUsb={false} />);
  expect(container).toBeEmptyDOMElement();
});

test("a risk shows a box with only the notes that apply", () => {
  render(<HardwareNotes risks={["old-nvidia"]} bazzite />);
  expect(screen.getByRole("heading", { name: "Your older NVIDIA card" })).toBeInTheDocument();
  expect(screen.getByText(/without "-open"/)).toBeInTheDocument();
  expect(screen.queryByText(/Wi-Fi:/)).toBeNull();
});
