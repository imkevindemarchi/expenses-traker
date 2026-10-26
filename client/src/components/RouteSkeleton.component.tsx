import RouteLoadingNavigation from "./RouteLoadingNavigation.component";
import { useLocation } from "react-router";
import PageSkeleton from "./PageSkeleton.component";
import { Shape } from "./LoadingShapes.component";
import YearPicker from "./YearPicker.component";
import { annualYear } from "../utils/annual-year";
import { today } from "../api";
import "../styles/Settings.styles.css";
import "../styles/SectionNavigation.styles.css";

function RouteSkeletonContent() {
  const { pathname, search } = useLocation();
  if (pathname === "/annual") return <>
    <div className="annual-filter"><YearPicker value={annualYear(new URLSearchParams(search).get("year"), Number(today().slice(0, 4)))} onChange={() => {}} /></div>
    <PageSkeleton layout="annual" />
  </>;
  if (pathname === "/settings") return <div className="subscription-settings-page"><div className="settings-layout">
    <div className="loading-settings-navigation" aria-hidden="true">{Array.from({ length: 4 }, (_, i) => <Shape key={i} height={48} />)}</div>
    <div className="settings-sections settings-redesign"><PageSkeleton layout="settings" /></div>
  </div></div>;
  return <PageSkeleton />;
}

export default function RouteSkeleton() {
  return <><RouteSkeletonContent /><RouteLoadingNavigation /></>;
}
