const TEX = "/textures/planets";

export interface RingDef {
  texture: string;
  inner: number;
  outer: number;
}

export interface PlanetDef {
  name: string;
  /** diffuse texture (color) */
  texture: string;
  /** sphere radius in scene units (compressed real proportions) */
  radius: number;
  /** base orbit radius in scene units (rank order) */
  orbit: number;
  /** axial tilt in radians (flavor) */
  tilt: number;
  /** atmosphere rim tint */
  atmosphere: string;
  /** Saturn-style ring, if any */
  ring?: RingDef;
  /** Earth gets the day/night + clouds treatment */
  earth?: boolean;
}

/**
 * Ranks #2–#9 map to Mercury→Neptune, in solar-system order. Sizes are
 * compressed real proportions (gas giants read large, rocky worlds stay
 * visible); orbits increase with rank.
 */
export const PLANETS: PlanetDef[] = [
  { name: "Mercury", texture: `${TEX}/2k_mercury.jpg`, radius: 0.34, orbit: 5.2, tilt: 0.0, atmosphere: "#9a8d7a" },
  { name: "Venus", texture: `${TEX}/2k_venus_surface.jpg`, radius: 0.55, orbit: 6.8, tilt: 0.05, atmosphere: "#e8c98a" },
  { name: "Earth", texture: `${TEX}/2k_earth_daymap.jpg`, radius: 0.58, orbit: 8.6, tilt: 0.41, atmosphere: "#6fb4ff", earth: true },
  { name: "Mars", texture: `${TEX}/2k_mars.jpg`, radius: 0.44, orbit: 10.4, tilt: 0.44, atmosphere: "#e07a55" },
  { name: "Jupiter", texture: `${TEX}/2k_jupiter.jpg`, radius: 1.5, orbit: 13.6, tilt: 0.05, atmosphere: "#d9b58a" },
  {
    name: "Saturn",
    texture: `${TEX}/2k_saturn.jpg`,
    radius: 1.25,
    orbit: 17.4,
    tilt: 0.47,
    atmosphere: "#e6cfa0",
    ring: { texture: `${TEX}/2k_saturn_ring_alpha.png`, inner: 1.6, outer: 2.8 },
  },
  { name: "Uranus", texture: `${TEX}/2k_uranus.jpg`, radius: 0.85, orbit: 20.6, tilt: 1.7, atmosphere: "#a8e0e6" },
  { name: "Neptune", texture: `${TEX}/2k_neptune.jpg`, radius: 0.82, orbit: 23.4, tilt: 0.49, atmosphere: "#5b7bff" },
];

export const SUN_TEXTURE = `${TEX}/2k_sun.jpg`;
export const NEBULA_TEXTURE = `${TEX}/2k_stars_milky_way.jpg`;

/** The real-planet definition for the i-th ranked planet (0 = rank #2). */
export function planetForIndex(i: number): PlanetDef | undefined {
  return PLANETS[i];
}

/** How many ranked distros (beyond #1) can be shown as real planets. */
export const MAX_PLANETS = PLANETS.length;
