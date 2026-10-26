import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../styles/LoadingShapes.styles.css";

export function Shape({ width = "100%", height = 16, round = false }: { width?: CSSProperties["width"]; height?: CSSProperties["height"]; round?: boolean }) {
  return <span aria-hidden="true" className={`loading-shape${round ? " loading-shape--round" : ""}`} style={{ width, height }} />;
}
export function LoadingRegion({ layout, children }: { layout: string; children: ReactNode }) {
  const { i18n } = useTranslation();
  return <div className="loading-region" data-skeleton-layout={layout} role="status" aria-busy="true" aria-label={i18n.language.startsWith("it") ? "Caricamento in corso" : "Loading"}>
    <div className="loading-shapes" aria-hidden="true">{children}</div>
  </div>;
}
export function Lines({ count = 3 }: { count?: number }) {
  return <div className="loading-stack">{Array.from({ length: count }, (_, i) => <Shape key={i} width={i % 2 ? "82%" : "62%"} />)}</div>;
}
export function LoadingHeading({ icon = false }: { icon?: boolean }) {
  return <div className="loading-heading">{icon && <Shape width={44} height={44} />}<div className="loading-stack"><Shape width="min(260px, 85%)" height={26} /><Shape width="min(360px, 95%)" height={14} /></div></div>;
}
export function LoadingFields({ count = 4 }: { count?: number }) {
  return <div className="loading-fields">{Array.from({ length: count }, (_, i) => <div className="loading-stack" key={i}><Shape width="45%" height={14} /><Shape height={48} /></div>)}</div>;
}
export function LoadingChart({ donut = false }: { donut?: boolean }) {
  return donut ? <div className="loading-donut"><Shape width={160} height={160} round /><Lines /></div> : <div className="loading-chart">{[45, 70, 50, 85, 60, 95, 72, 86].map((height, i) => <Shape key={i} height={height + "%"} />)}</div>;
}

