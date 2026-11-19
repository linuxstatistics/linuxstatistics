import { expect, test } from "vitest";
import { readableAnswers } from "../src/lib/admin-decode";
import { encodeAnswers } from "../src/lib/picker-questions";

test("advanced quiz codes decode to option labels in question order", () => {
  const code = encodeAnswers({ from: "windows", use: "everyday" } as never);
  const text = readableAnswers("pick", code);
  expect(text.startsWith("Windows · Everyday use")).toBe(true);
});

test("short quiz codes decode value by value and keep unknown values as-is", () => {
  expect(readableAnswers("start", "windows.pc.gaming")).toBe("Windows · A regular 64-bit PC · Games");
  expect(readableAnswers("start", "windows.newthing")).toBe("Windows · newthing");
});

test("bad or unknown input never throws", () => {
  expect(readableAnswers("pick", "zz")).toBe("(unreadable code zz)");
  expect(readableAnswers("other", "abc")).toBe("abc");
});
