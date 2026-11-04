import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Mesh, SRGBColorSpace } from "three";
import { SUN_TEXTURE } from "./planetMap";
import { Atmosphere } from "./Atmosphere";

/** The star at the center = #1 distro. Bright enough to drive bloom + lights the planets. */
export function Sun({ radius = 2.6 }: { radius?: number }) {
  const tex = useTexture(SUN_TEXTURE);
  const ref = useRef<Mesh>(null);
  useMemo(() => {
    tex.colorSpace = SRGBColorSpace;
  }, [tex]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.015;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial map={tex} color="#ffdca8" toneMapped={false} />
      </mesh>
      <Atmosphere radius={radius * 1.18} color="#ffd27a" intensity={1.8} />
      <Atmosphere radius={radius * 1.55} color="#ff9a2e" intensity={0.7} />
      <Atmosphere radius={radius * 2.3} color="#ff7a14" intensity={0.28} />
      <pointLight position={[0, 0, 0]} intensity={3.2} decay={0} color="#fff2d6" />
    </group>
  );
}
