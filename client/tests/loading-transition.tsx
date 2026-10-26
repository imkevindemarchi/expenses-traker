// Isolated, deterministic chunk/data transition fixture. No backend traffic.
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import "../src/i18n";
import "../src/index.css";
import "../src/styles/SharedTypography.styles.css";
import "../src/styles/StandaloneSettings.styles.css";
import RouteSkeleton from "../src/components/RouteSkeleton.component";
const query = new URLSearchParams(location.search);
const path = query.get("route") || "/annual";
query.delete("route");
window.fetch = () => new Promise(() => {});
let advance = () => {};
const ready = new Promise<void>(resolve => { advance = resolve; });
const noop = () => {};
const Page = lazy(async () => {
  await ready;
  if (path === "/settings") { const { default: Settings } = await import("../src/pages/Settings.page"); return { default: () => <><span hidden data-testid="page-ready" /><Settings user={{_id:"demo",name:"Demo",surname:"",monthlyBudgetCents:10000,currency:"EUR"} as never} onSaved={noop} onNotice={noop} onDeleted={noop} onImported={noop} /></> }; }
  const { default: Annual } = await import("../src/pages/Annual.page");
  return { default: () => <><span hidden data-testid="page-ready" /><Annual refresh={0} categories={new Map()} subcategories={new Map()} onEdit={noop} onDelete={noop} /></> };
});
createRoot(document.getElementById("root")!).render(<MemoryRouter initialEntries={[path+"?"+query.toString()]}>
  <button style={{position:"fixed",top:0,zIndex:10000}} onClick={() => advance()}>Carica pagina</button>
  <main className={`app-main ui-refresh ${path === "/settings" ? "standalone-settings-page" : ""}`}><Suspense fallback={<RouteSkeleton />}><Page /></Suspense></main>
</MemoryRouter>);
