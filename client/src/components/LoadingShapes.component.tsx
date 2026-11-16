import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../styles/LoadingShapes.styles.css";

export function Shape({
  width = "100%",
  height = 16,
  round = false,
}: {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  round?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`loading-shape${round ? " loading-shape--round" : ""}`}
      style={{ width, height }}
    />
  );
}
export function LoadingRegion({ layout, children }: { layout: string; children: ReactNode }) {
  const { i18n } = useTranslation();
  return (
    <div
      className="loading-region"
      data-skeleton-layout={layout}
      role="status"
      aria-busy="true"
      aria-label={i18n.language.startsWith("it") ? "Caricamento in corso" : "Loading"}
    >
      <div className="loading-shapes" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
