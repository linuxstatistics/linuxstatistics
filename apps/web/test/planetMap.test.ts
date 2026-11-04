import { expect, test } from "vitest";
import { PLANETS, MAX_PLANETS, planetForIndex } from "../src/components/galaxy/planetMap";

test("maps ranks #2–#9 to the eight planets in solar-system order", () => {
  expect(PLANETS.map((p) => p.name)).toEqual([
    "Mercury",
    "Venus",
    "Earth",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
  ]);
  expect(MAX_PLANETS).toBe(8);
});

test("planetForIndex returns the body for a slot, undefined past Neptune", () => {
  expect(planetForIndex(0)?.name).toBe("Mercury");
  expect(planetForIndex(7)?.name).toBe("Neptune");
  expect(planetForIndex(8)).toBeUndefined();
});

test("orbits strictly increase with rank and Earth/Saturn carry their extras", () => {
  for (let i = 1; i < PLANETS.length; i++) {
    expect(PLANETS[i]!.orbit).toBeGreaterThan(PLANETS[i - 1]!.orbit);
  }
  expect(PLANETS.find((p) => p.name === "Earth")?.earth).toBe(true);
  expect(PLANETS.find((p) => p.name === "Saturn")?.ring).toBeDefined();
});
