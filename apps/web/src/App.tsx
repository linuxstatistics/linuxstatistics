import { Header } from "./components/Header";
import { ListPage } from "./components/ListPage";
import { DetailPanel } from "./components/DetailPanel";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <ListPage />
      </main>
      <DetailPanel />
      <Footer />
    </div>
  );
}
