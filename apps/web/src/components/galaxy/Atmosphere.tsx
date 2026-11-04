import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color, ShaderMaterial } from "three";

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.6);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`;

/** Additive fresnel rim-glow shell — atmosphere for planets, corona for the sun. */
export function Atmosphere({
  radius,
  color,
  intensity = 0.8,
}: {
  radius: number;
  color: string;
  intensity?: number;
}) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color(color) },
          uIntensity: { value: intensity },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
      }),
    [color, intensity],
  );
  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 48, 48]} />
    </mesh>
  );
}
