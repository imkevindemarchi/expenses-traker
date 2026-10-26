import { useLocation } from "react-router";
import { Shape, Lines, LoadingRegion, LoadingHeading, LoadingFields, LoadingChart } from "./LoadingShapes.component";
import "../styles/PageLoading.styles.css";

export type ExpenseSkeletonLayout = "overview" | "annual" | "entries" | "categories" | "settings" | "options" | "pagination";
export function expenseSkeletonLayout(path: string): ExpenseSkeletonLayout {
  if (path === "/settings") return "settings";
  if (path === "/annual") return "annual";
  if (path === "/entries") return "entries";
  if (path === "/management") return "categories";
  return "overview";
}
function Entries({ rows }: { rows: number }) {
  return <><div className="loading-desktop-table">{Array.from({ length: rows + 1 }, (_, i) => <div className={`loading-table-row loading-entry-row ${i === 0 ? "loading-table-row--heading" : ""}`} key={i}><div className="loading-row"><Shape width={32} height={32} /><Shape width={32} height={32} /></div><Shape width={36} height={36} /><Lines count={i ? 2 : 1} /><Shape height={20} /></div>)}</div><div className="loading-mobile-cards loading-responsive-cards">{Array.from({ length: rows }, (_, i) => <div className="loading-card loading-entry-card" key={i}><div className="loading-row"><Shape width={34} height={34} /><Shape width="48%" height={18} /><Shape width={28} height={28} /></div><div className="loading-row"><Lines count={2} /><Shape width={84} height={24} /></div></div>)}</div></>;
}
function Overview({ annual, budget }: { annual: boolean; budget: boolean }) {
  return <><div className="loading-grid loading-expense-overview">{[0, 1, 2].map(i => <div className="loading-panel" key={i}><LoadingHeading /><Shape height={i ? 36 : 58} width="60%" /><div className="loading-toolbar"><Shape width="75%" height={14} /></div>{i === 0 && <Shape width="55%" height={26} />}</div>)}</div>{budget && <div className="loading-panel"><LoadingHeading /><Shape height={10} /><div className="loading-toolbar"><Shape width="55%" height={14} /></div></div>}<div className="loading-grid loading-expense-charts"><div className="loading-panel"><LoadingHeading /><LoadingChart /></div><div className="loading-panel"><LoadingHeading /><LoadingChart donut /></div></div>{annual && <div className="loading-panel"><LoadingHeading /><Entries rows={5} /></div>}</>;
}
export default function PageSkeleton({ compact = false, layout, rows = 5, budget = false }: { compact?: boolean; layout?: ExpenseSkeletonLayout; rows?: number; budget?: boolean }) {
  const { pathname } = useLocation();
  const variant = layout ?? (compact ? "entries" : expenseSkeletonLayout(pathname));
  let body;
  if (variant === "entries") body = <Entries rows={rows} />;
  else if (variant === "pagination") body = <div className="loading-pagination"><Shape width={36} height={36} /><Shape width={100} height={36} /><Shape width={36} height={36} /></div>;
  else if (variant === "options") body = <div className="loading-stack">{[0, 1, 2].map(i => <div className="loading-row loading-option" key={i}><Shape width={36} height={36} /><Lines count={2} /></div>)}</div>;
  else if (variant === "categories") body = <div className="loading-expense-categories">{[0, 1, 2, 3].map(i => <div className="loading-panel" key={i}><LoadingHeading icon /><div className="loading-toolbar"><Shape width={120} height={32} /><Shape width={90} height={32} /></div><Lines count={2} /></div>)}</div>;
  else if (variant === "settings") body = <div className="loading-stack"><LoadingHeading icon /><div className="loading-grid loading-grid--two">{[0, 1, 2, 3].map(i => <div className="loading-panel" key={i}><LoadingHeading icon /><LoadingFields count={i ? 2 : 3} /></div>)}</div></div>;
  else body = <Overview annual={variant === "annual"} budget={budget} />;
  return <LoadingRegion layout={variant}>{body}</LoadingRegion>;
}
