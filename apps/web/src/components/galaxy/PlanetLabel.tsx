import { Html } from "@react-three/drei";
import type { GalaxyBody } from "@linux-statistics/shared";
import { familyColor } from "../../lib/families";

/** Mission-control HUD label: distro name + planet/rank + family marker. */
export function PlanetLabel({
  body,
  position,
  planet,
  rank,
  isSun,
  onSelect,
}: {
  body: GalaxyBody;
  position: [number, number, number];
  planet: string;
  rank: number;
  isSun?: boolean;
  onSelect: () => void;
}) {
  return (
    <Html position={position} center className="planet-label" zIndexRange={[20, 0]}>
      <div className="box" onClick={onSelect}>
        <div className="name">{body.name}</div>
        <div className="sub">
          <span className="fam-dot" style={{ background: familyColor(body.family) }} />
          {isSun ? "SOL · #1" : `${planet} · #${rank}`}
        </div>
      </div>
    </Html>
  );
}
