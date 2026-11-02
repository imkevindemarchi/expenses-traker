// Isolated regression: destination chunks remain pending until explicitly released.
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import "../src/i18n";
import "../src/index.css";
import RouteSkeleton from "../src/components/RouteSkeleton.component";
import FloatingButton from "../src/components/FloatingButton.component";

const Pending = lazy(() => new Promise<{ default: () => null }>(() => {}));
const paths = ["/settings", "/annual"];
function Fixture() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          insetInline: 0,
          zIndex: 100000,
          padding: 8,
          background: "white",
          color: "black",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Link to="/">Home test</Link>
        {paths.map((path) => (
          <Link key={path} to={path}>
            {path}
          </Link>
        ))}
        <output aria-label="Percorso corrente">{location.pathname}</output>
      </nav>
      <div style={{ paddingTop: 120, minHeight: 2500 }}>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/" element={<p>Home test pronta</p>} />
            <Route path="*" element={<Pending />} />
          </Routes>
        </Suspense>
      </div>
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100000 }}>
        <FloatingButton
          ariaLabel="Navigazione test"
          icon={<Plus />}
          onClick={() => navigate("/settings")}
        />
      </div>
    </>
  );
}
window.history.replaceState(null, "", "/");
createRoot(document.getElementById("root")!).render(
  <BrowserRouter unstable_useTransitions={false}>
    <Fixture />
  </BrowserRouter>,
);
