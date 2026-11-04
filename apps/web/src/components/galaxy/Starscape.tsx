import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  SRGBColorSpace,
} from "three";
import { NEBULA_TEXTURE } from "./planetMap";

/** A soft round star sprite so points don't render as squares. */
function makeStarSprite(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(255,255,255,0.85)");
  g.addColorStop(0.5, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/** Deep starfield points + a Milky-Way nebula backdrop sphere. */
export function Starscape({ count = 2000 }: { count?: number }) {
  const nebula = useTexture(NEBULA_TEXTURE);
  useMemo(() => {
    nebula.colorSpace = SRGBColorSpace;
  }, [nebula]);

  const sprite = useMemo(() => makeStarSprite(), []);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // deterministic-ish scatter on a shell between the planets and the nebula
      const r = 55 + ((i * 9301 + 49297) % 233280) / 233280 * 30;
      const theta = ((i * 7) % 360) * (Math.PI / 180) + (i % 13) * 0.31;
      const phi = Math.acos(2 * (((i * 2654435761) % 1000) / 1000) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    return g;
  }, [count]);

  return (
    <group>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[120, 64, 64]} />
        <meshBasicMaterial map={nebula} side={BackSide} color="#7a86a8" depthWrite={false} />
      </mesh>
      <points geometry={geometry}>
        <pointsMaterial
          map={sprite}
          size={0.7}
          sizeAttenuation
          color="#ffffff"
          transparent
          alphaTest={0.02}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
