import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  Group,
  Mesh,
  RingGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from "three";
import type { PlanetDef, RingDef } from "./planetMap";
import { Atmosphere } from "./Atmosphere";

const EARTH = {
  day: "/textures/planets/2k_earth_daymap.jpg",
  night: "/textures/planets/2k_earth_nightmap.jpg",
  clouds: "/textures/planets/2k_earth_clouds.jpg",
};

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragment = /* glsl */ `
  uniform sampler2D dayTex;
  uniform sampler2D nightTex;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    float d = dot(normalize(vWorldNormal), normalize(sunDir));
    float t = smoothstep(-0.15, 0.25, d);
    vec3 day = texture2D(dayTex, vUv).rgb * max(d, 0.06);
    vec3 night = texture2D(nightTex, vUv).rgb * 1.3;
    gl_FragColor = vec4(mix(night, day, t), 1.0);
  }
`;

function GenericPlanet({ def }: { def: PlanetDef }) {
  const map = useTexture(def.texture);
  useMemo(() => {
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 4;
  }, [map]);
  return (
    <mesh>
      <sphereGeometry args={[def.radius, 64, 64]} />
      <meshStandardMaterial map={map} metalness={0} roughness={1} />
    </mesh>
  );
}

function EarthBody({
  def,
  position,
}: {
  def: PlanetDef;
  position: [number, number, number];
}) {
  const [day, night, clouds] = useTexture([EARTH.day, EARTH.night, EARTH.clouds]) as [
    Texture,
    Texture,
    Texture,
  ];
  const cloudsRef = useRef<Mesh>(null);
  const material = useMemo(() => {
    day.colorSpace = SRGBColorSpace;
    night.colorSpace = SRGBColorSpace;
    const sunDir = new Vector3(position[0], position[1], position[2])
      .multiplyScalar(-1)
      .normalize();
    return new ShaderMaterial({
      uniforms: {
        dayTex: { value: day },
        nightTex: { value: night },
        sunDir: { value: sunDir },
      },
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
    });
  }, [day, night, position]);

  useFrame((_, dt) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * 0.012;
  });

  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[def.radius, 64, 64]} />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[def.radius * 1.012, 64, 64]} />
        <meshStandardMaterial map={clouds} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SaturnRing({ ring }: { ring: RingDef }) {
  const tex = useTexture(ring.texture);
  const geometry = useMemo(() => {
    const g = new RingGeometry(ring.inner, ring.outer, 128);
    const pos = g.attributes.position!;
    const uv = g.attributes.uv!;
    const v = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const r = v.length();
      uv.setXY(i, (r - ring.inner) / (ring.outer - ring.inner), 0.5);
    }
    return g;
  }, [ring]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial map={tex} transparent side={DoubleSide} depthWrite={false} opacity={0.9} />
    </mesh>
  );
}

/** A photoreal planet: spinning textured sphere + atmosphere (+ Earth/ring extras). */
export function Planet({
  def,
  position,
}: {
  def: PlanetDef;
  position: [number, number, number];
}) {
  const spin = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.08;
  });
  return (
    <group position={position} rotation={[0, 0, def.tilt]}>
      <group ref={spin}>
        {def.earth ? <EarthBody def={def} position={position} /> : <GenericPlanet def={def} />}
      </group>
      <Atmosphere
        radius={def.radius * 1.03}
        color={def.atmosphere}
        intensity={def.earth ? 1.1 : 0.7}
      />
      {def.ring && <SaturnRing ring={def.ring} />}
    </group>
  );
}
