import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import RouteLoadingNavigation from "./RouteLoadingNavigation.component";
import Header from "./Header.component";
import { OverviewSkeleton, SettingsSkeleton } from "./Skeletons.component";
import { annualYear } from "../utils/annual-year";
import { today } from "../api";
import { tr } from "../i18n";
import { ROUTE_PATHS } from "../routes/routes.config";
import { CalendarRange, ChevronDown } from "lucide-react";
import "../styles/v2/Analytics.styles.css";
import "../styles/v2/Expenses.styles.css";

/** The lazy pages (annual summary, settings) while their code loads. */
function RouteSkeletonContent() {
  useTranslation();
  const { pathname, search } = useLocation();
  if (pathname === ROUTE_PATHS.annual)
    return (
      <main className="analytics-page ios-analytics w-full pb-8 md:py-10">
        <div className="analytics-content mx-auto flex w-full flex-col">
          <Header title={tr("Riepilogo annuale")} />
          <div className="ios-analytics__period-dock" aria-hidden="true">
            <span className="ios-analytics__period">
              <CalendarRange size={18} strokeWidth={2} />
              <span className="ios-analytics__period-label">
                {annualYear(new URLSearchParams(search).get("year"), Number(today().slice(0, 4)))}
              </span>
              <ChevronDown size={16} strokeWidth={2.4} />
            </span>
          </div>
          <OverviewSkeleton layout="year" />
        </div>
      </main>
    );
  if (pathname === ROUTE_PATHS.settings)
    return (
      <main className="subscription-settings-page ios-settings w-full pb-8 md:py-10">
        <Header title={tr("Impostazioni")} />
        <SettingsSkeleton />
      </main>
    );
  return null;
}

export default function RouteSkeleton() {
  return (
    <>
      <RouteSkeletonContent />
      <RouteLoadingNavigation />
    </>
  );
}
