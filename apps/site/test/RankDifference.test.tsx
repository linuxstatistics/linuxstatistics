import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RankDifference } from "../src/components/RankDifference";

afterEach(cleanup);

test("zero means same rank, not missing data", () => {
  const { container } = render(<RankDifference value={0} />);
  expect(screen.getByText("– 0")).toHaveAttribute("aria-hidden", "true");
  expect(container.firstChild).toHaveAttribute("title", "Same position in the last-month and 12-month rankings");
  expect(screen.getByText("Same position in the last-month and 12-month rankings")).toHaveClass("visually-hidden");
});

test("missing comparison is labelled separately", () => {
  render(<RankDifference value={null} />);
  expect(screen.getByText("No data")).toBeInTheDocument();
});

test.each([3, -2])("rank difference %s names the comparison windows", (value) => {
  const { container } = render(<RankDifference value={value} />);
  const label = `${Math.abs(value)} places ${value > 0 ? "higher" : "lower"} in the last-month ranking than the 12-month ranking`;
  expect(screen.getByText(label)).toHaveClass("visually-hidden");
  expect(container.querySelector("[aria-hidden]")).toHaveTextContent(`${value > 0 ? "▲" : "▼"} ${Math.abs(value)}`);
  // No aria-label on a generic span: screen readers ignore it there.
  expect(container.querySelector("[aria-label]")).toBeNull();
});
