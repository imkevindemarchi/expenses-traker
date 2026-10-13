import { ChartSkeleton, RowSkeleton, Placeholder } from "./UiSkeleton.component";
import { useTranslation } from "react-i18next";
import Glass from "./Glass.component";
import { tr } from "../i18n";
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton-block ${className}`} />;
}
export function OverviewSkeleton({ budget = false, annual = false }: { budget?: boolean; annual?: boolean }) {
  useTranslation();
  return (
    <div role="status" aria-label={tr("Caricamento riepilogo")}>
      <div className="overview-grid">
        {["balance-card", "stat-card", "stat-card"].map((className, index) => (
          <Glass key={index} className={className}>
            <div className="skeleton-stack">
              <SkeletonBlock className="skeleton-icon" />
              <SkeletonBlock className="skeleton-label" />
              <SkeletonBlock className="skeleton-amount" />
              <SkeletonBlock className="skeleton-label" />
            </div>
          </Glass>
        ))}
      </div>
      {budget && (
        <Glass className="panel budget-panel">
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-label" />
            <SkeletonBlock className="skeleton-amount" />
            <SkeletonBlock className="skeleton-bar" />
          </div>
        </Glass>
      )}
      <div className="charts-grid">
        <Glass className="panel">
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-label" />
            <ChartSkeleton kind={annual ? "bars" : "line"} />
          </div>
        </Glass>
        <Glass className="panel">
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-label" />
            <ChartSkeleton kind="donut" />
          </div>
        </Glass>
      </div>
      {annual && <Glass className="panel"><Placeholder className="sk-section-title"/><RowSkeleton/><RowSkeleton/><RowSkeleton/></Glass>}
    </div>
  );
}
export function CategoriesSkeleton() {
  useTranslation();
  return (
    <div role="status" aria-label={tr("Caricamento categorie")} className="category-grid">
      {[0, 1, 2].map((index) => (
        <Glass key={index} className="category-card">
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-icon" />
            <SkeletonBlock className="skeleton-label" />
            <SkeletonBlock className="skeleton-bar" />
            <SkeletonBlock className="skeleton-bar" />
            <SkeletonBlock className="skeleton-bar" />
          </div>
        </Glass>
      ))}
    </div>
  );
}
