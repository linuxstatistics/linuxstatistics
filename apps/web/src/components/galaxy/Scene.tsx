import type { GalaxyPayload } from "@linux-statistics/shared";
import { useStore } from "../../store";
import { Sun } from "./Sun";
import { Planet } from "./Planet";
import { Starscape } from "./Starscape";
import { OrbitRing } from "./OrbitRing";
import { PlanetLabel } from "./PlanetLabel";
import { PLANETS } from "./planetMap";

const GOLDEN_ANGLE = 2.39996;

export function Scene({ galaxy }: { galaxy: GalaxyPayload }) {
  const setSelected = useStore((s) => s.setSelected);
  const planets = galaxy.planets.slice(0, PLANETS.length);

  return (
    <group>
      <ambientLight intensity={0.07} />

      <Sun />
      <PlanetLabel
        body={galaxy.sun}
        position={[0, 3.6, 0]}
        planet="SOL"
        rank={1}
        isSun
        onSelect={() => setSelected(galaxy.sun.slug)}
      />

      {planets.map((body, i) => {
        const def = PLANETS[i]!;
        const angle = i * GOLDEN_ANGLE;
        const position: [number, number, number] = [
          Math.cos(angle) * def.orbit,
          0,
          Math.sin(angle) * def.orbit,
        ];
        return (
          <group key={body.slug}>
            <OrbitRing radius={def.orbit} />
            <Planet def={def} position={position} />
            <PlanetLabel
              body={body}
              position={[position[0], def.radius + 0.8, position[2]]}
              planet={def.name}
              rank={i + 2}
              onSelect={() => setSelected(body.slug)}
            />
          </group>
        );
      })}

      <Starscape count={Math.min(2600, 1000 + galaxy.starfield.length * 28)} />
    </group>
  );
}
