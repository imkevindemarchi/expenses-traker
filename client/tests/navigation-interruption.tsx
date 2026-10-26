/* eslint-disable react-refresh/only-export-components -- Standalone browser regression entry. */
// Deterministic navigation regression fixture: code and API requests can stay pending.
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router";
import "../src/i18n";
import "../src/index.css";
import RouteSkeleton from "../src/components/RouteSkeleton.component";

let release = () => {};
const ready = new Promise<void>(resolve => { release = resolve; });
const Page = lazy(async () => { await ready; return import("../src/pages/Settings.page"); });
function Fixture() {
 return <>
 <button data-testid="release" onClick={() => release()}>Load code</button>
 <Suspense fallback={<RouteSkeleton  />}>
 <Routes>
 <Route element={<Outlet context={{ scrollToTop: () => {} }} />}>
 <Route path="/" element={<Link to="/settings" data-testid="open">Open card</Link>} />
 <Route path="/settings" element={<><span data-testid="page-ready" /><Page user={{_id:"demo",name:"Demo",surname:"",monthlyBudgetCents:10000,currency:"EUR"} as never} onSaved={() => {}} onNotice={() => {}} onDeleted={() => {}} onImported={() => {}} /></>} />
 <Route path="*" element={<p data-testid="other-page">Destination reached</p>} />
 </Route>
 </Routes>
 </Suspense>
 </>;
}
window.history.replaceState(null, "", "/");
createRoot(document.getElementById("root")!).render(<BrowserRouter unstable_useTransitions={false}><Fixture /></BrowserRouter>);
