import { Suspense, lazy, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { ListPage } from "./components/ListPage";
import { DetailPanel } from "./components/DetailPanel";
import { Footer } from "./components/Footer";
import { useStore } from "./store";
import { isWebGLAvailable } from "./lib/webgl";
import { useIsMobile } from "./lib/useIsMobile";

const GalaxyView = lazy(() => import("./components/GalaxyView"));

export default function App() {
  const webgl = useMemo(isWebGLAvailable, []);
  const isMobile = useIsMobile();
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  // The 3D Galaxy is desktop-only: disabled on mobile and without WebGL.
  const canUseGalaxy = webgl && !isMobile;

  useEffect(() => {
    if (!canUseGalaxy) setView("list");
  }, [canUseGalaxy, setView]);

  const showGalaxy = canUseGalaxy && view === "galaxy";

  return (
    <div className="app">
      <Header canUseGalaxy={canUseGalaxy} />
      <main className="app-main">
        {showGalaxy ? (
          <Suspense fallback={<div className="loading">Loading 3D…</div>}>
            <GalaxyView />
          </Suspense>
        ) : (
          <ListPage />
        )}
      </main>
      <DetailPanel />
      <Footer />
    </div>
  );
}
