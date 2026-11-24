import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Faq } from "../src/components/Faq";

afterEach(cleanup);

const items = [
  { q: "First?", a: "One." },
  { q: "Second?", a: "Two." },
];

test("questions are open by default", () => {
  const { container } = render(<Faq items={items} />);
  expect(container.querySelectorAll("details[open]")).toHaveLength(2);
});

test("open={false} starts every question collapsed, answers still in the page", () => {
  const { container } = render(<Faq items={items} open={false} />);
  expect(container.querySelectorAll("details")).toHaveLength(2);
  expect(container.querySelectorAll("details[open]")).toHaveLength(0);
  expect(container.textContent).toContain("Two.");
});

test("an empty list renders nothing", () => {
  const { container } = render(<Faq items={[]} open={false} />);
  expect(container).toBeEmptyDOMElement();
});
