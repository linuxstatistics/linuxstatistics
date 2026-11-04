import { DoubleSide } from "three";

export function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 96]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={DoubleSide} depthWrite={false} />
    </mesh>
  );
}
