import type { PropsWithChildren } from "react";
export default function Glass({
  children,
  className = "",
  "data-muscle": muscle,
}: PropsWithChildren<{ className?: string; "data-muscle"?: string }>) {
  return (
    <section
      data-muscle={muscle}
      className={`analytics-surface content-section relative ${className}`}
    >
      <div className="relative h-full">{children}</div>
    </section>
  );
}
