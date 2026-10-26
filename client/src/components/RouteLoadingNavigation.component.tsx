import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import FloatingButton from "./FloatingButton.component";
import { tr } from "../i18n";

/** URL-based navigation stays available while the destination code or data loads. */
export default function RouteLoadingNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const fallback = path === "/settings" ? "/" : "";
  if (!fallback) return null;
  return <div className="floating-actions mobile-floating-actions fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3">
    <FloatingButton alwaysVisibleOnMobile ariaLabel={tr("Indietro")} icon={<ChevronLeft size={24} />} onClick={() => location.key === "default" ? navigate(fallback, { replace: true }) : navigate(-1)} />
  </div>;
}
