import { expect, test } from "vitest";
import { FAMILIES, familySchema, distroStatusSchema } from "../src/families.js";

test("FAMILIES includes the core distro families", () => {
  expect(FAMILIES).toContain("debian");
  expect(FAMILIES).toContain("arch");
  expect(FAMILIES).toContain("rpm");
  expect(FAMILIES).toContain("independent");
});

test("familySchema rejects unknown families", () => {
  expect(() => familySchema.parse("windows")).toThrow();
  expect(familySchema.parse("debian")).toBe("debian");
});

test("distroStatusSchema accepts active/discontinued only", () => {
  expect(distroStatusSchema.parse("active")).toBe("active");
  expect(() => distroStatusSchema.parse("paused")).toThrow();
});
