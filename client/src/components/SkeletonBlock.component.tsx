import "../styles/UiSkeleton.styles.css";
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton-block ui-placeholder ${className}`} />;
}
