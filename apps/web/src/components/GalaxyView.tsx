import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { useGalaxy } from "../api";
import { Scene } from "./galaxy/Scene";
import { ShareCard } from "./ShareCard";

// View direction (normalized [0, 14, 38]); camera sits along this, distance fit to aspect.
const VIEW_DIR = new Vector3(0, 14, 38).normalize();
// Half-width the framing should cover (just past Neptune's orbit).
const FIT_HALF_WIDTH = 26;

/**
 * Distances the camera along a fixed direction so the solar system fills the
 * viewport width at any aspect ratio (wider window → camera pulls in, no empty
 * side margins). Re-fits on resize; users can still orbit/zoom between resizes.
 */
type ControlsRef = React.ElementRef<typeof OrbitControls>;

function FitCamera({ controls }: { controls: React.RefObject<ControlsRef> }) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const aspect = width / Math.max(1, height);
    const vfov = ((camera as { fov?: number }).fov ?? 50) * (Math.PI / 180);
    // distance so the horizontal half-extent at the origin ≈ FIT_HALF_WIDTH
    const raw = FIT_HALF_WIDTH / (Math.tan(vfov / 2) * aspect);
    const dist = Math.min(60, Math.max(20, raw));
    camera.position.copy(VIEW_DIR.clone().multiplyScalar(dist));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls.current?.update?.();
  }, [camera, width, height, controls]);

  return null;
}

export default function GalaxyView() {
  const { data, isLoading, isError } = useGalaxy();
  const controls = useRef<ControlsRef>(null);

  if (isLoading) return <div className="loading">Charting the galaxy…</div>;
  if (isError || !data) return <div className="error">Couldn’t load the galaxy. Is the API running?</div>;

  return (
    <div className="galaxy-view">
      <Canvas camera={{ position: [0, 14, 38], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <Scene galaxy={data} />
        </Suspense>
        <OrbitControls
          ref={controls}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.25}
          minDistance={8}
          maxDistance={70}
        />
        <FitCamera controls={controls} />
      </Canvas>
      <ShareCard className="hud" hint="click a planet for details" />
    </div>
  );
}
