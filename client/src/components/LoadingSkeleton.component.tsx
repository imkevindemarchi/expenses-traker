import EntriesSkeleton from "./EntriesSkeleton.component";
import { ChartSkeleton, Placeholder } from "./UiSkeleton.component";
import { useTranslation } from "react-i18next";
import Glass from "./Glass.component";
import { tr } from "../i18n";
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton-block ${className}`} />;
}
export function OverviewSkeleton({ budget = false, annual = false }: { budget?: boolean; annual?: boolean }) {
  useTranslation();
  return (
    <div role="status" aria-busy="true" data-skeleton-layout="overview" aria-label={tr("Caricamento riepilogo")}>
<div className="overview-grid">
        <Glass className="balance-card"><div className="balance-heading"><Placeholder className="sk-label" /><Placeholder className="round-icon" /></div><Placeholder className="sk-overview-balance" /><Placeholder className="sk-overview-description" /><Placeholder className="sk-pill" /></Glass>
        <Glass className="stat-card"><Placeholder className="stat-icon" /><Placeholder className="sk-label" /><Placeholder className="sk-overview-amount" /><Placeholder className="sk-caption" /></Glass>
        <Glass className="stat-card"><Placeholder className="stat-icon" /><Placeholder className="sk-label" /><Placeholder className="sk-overview-amount" /><Placeholder className="sk-caption" /></Glass>
      </div>
      {budget && (
        <Glass className="panel budget-panel">
          <div className="budget-heading"><div><Placeholder className="sk-label" /><Placeholder className="sk-section-title" /></div><Placeholder className="sk-icon" /></div><Placeholder className="sk-overview-balance" /><Placeholder className="sk-caption" /><Placeholder className="sk-budget-track" /><Placeholder className="sk-caption" />
        </Glass>
      )}
      <div className="charts-grid">
        <Glass className="panel">
          <div className="section-heading"><Placeholder className="sk-section-title" />{!annual && <Placeholder className="sk-label" />}</div>
          {annual ? <div className="h-64 w-full sm:h-72 lg:h-80"><ChartSkeleton kind="bars" fill /></div> : <div className="trend"><ChartSkeleton trend /><Placeholder className="sk-trend-note" /></div>}
        </Glass>
        <Glass className="panel">
          {!annual && <Placeholder className="sk-label sk-breakdown-eyebrow" />}
          <Placeholder className="sk-section-title" />
          <div className="breakdown"><Placeholder className="donut sk-overview-donut" /><div className="category-legend">{[0,1,2].map(index => <div key={index}><Placeholder className="sk-text" /><Placeholder className="sk-value" /></div>)}</div></div>
        </Glass>
      </div>
      {annual && <Glass className="panel"><Placeholder className="sk-section-title"/><EntriesSkeleton /></Glass>}
    </div>
  );
}
export function CategoriesSkeleton() {
 useTranslation();
 return <div role="status" aria-busy="true" aria-label={tr("Caricamento categorie")} className="category-grid">{[0,1,2].map(index => <section className="category-card sk-category-card" key={index}><div className="category-header"><Placeholder className="sk-category-action" /><Placeholder className="sk-category-action" /><Placeholder className="category-orb" /><Placeholder className="sk-text" /></div><div className="sk-category-subheading"><Placeholder className="sk-label" /><Placeholder className="sk-pill" /></div><div className="subcategory-list">{[0,1,2].map(child => <div className="subcategory" key={child}><Placeholder className="sk-text" /><div className="entry-card-actions"><Placeholder className="sk-entry-action" /><Placeholder className="sk-entry-action" /></div></div>)}</div><Placeholder className="sk-entry-page-size" /></section>)}</div>;
}
