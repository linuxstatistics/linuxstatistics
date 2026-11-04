import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RatingWidget } from "../src/components/RatingWidget";

afterEach(cleanup);

test("logged-out users see a sign-in prompt", () => {
  render(<RatingWidget me={null} mine={null} onSave={vi.fn()} onDelete={vi.fn()} />);
  expect(screen.getByText(/Sign in to rate/i)).toBeInTheDocument();
});

test("logged-in users see the star controls", () => {
  render(
    <RatingWidget
      me={{ id: 1, provider: "github", username: "octocat", avatarUrl: null, role: "user" }}
      mine={null}
      onSave={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
  expect(screen.getByRole("group", { name: /your rating/i })).toBeInTheDocument();
  expect(screen.getByLabelText("I use this")).toBeInTheDocument();
});

const me = { id: 1, provider: "github" as const, username: "octocat", avatarUrl: null, role: "user" as const };

test("after saving, confirms and explains when the score updates", () => {
  render(
    <RatingWidget
      me={me}
      mine={{ rating: 5, usesIt: false, reviewBody: null }}
      onSave={vi.fn()}
      onDelete={vi.fn()}
      saved
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(/thanks/i);
});
