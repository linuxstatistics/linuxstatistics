import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RankDifference } from "../src/components/RankDifference";

afterEach(cleanup);

test("zero means same rank, not missing data", () => {
  render(<RankDifference value={0} />);
  expect(screen.getByText("Same rank")).toHaveAttribute("title", "Same position in the last-month and 12-month rankings");
});

test("missing comparison is labelled separately", () => {
  render(<RankDifference value={null} />);
  expect(screen.getByText("No data")).toBeInTheDocument();
});

test.each([3, -2])("rank difference %s names the comparison windows", (value) => {
  render(<RankDifference value={value} />);
  expect(screen.getByLabelText(`${Math.abs(value)} places ${value > 0 ? "higher" : "lower"} in the last-month ranking than the 12-month ranking`)).toHaveTextContent(String(Math.abs(value)));
});
