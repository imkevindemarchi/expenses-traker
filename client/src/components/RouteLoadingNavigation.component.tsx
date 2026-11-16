import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import FloatingButton from "./FloatingButton.component";
import { useTranslation } from "react-i18next";
import { tr } from "../i18n";
import { ROUTE_PATHS } from "../routes/routes.config";

/** "Back" stays available while the settings code loads. */
export default function RouteLoadingNavigation() {
  useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname !== ROUTE_PATHS.settings) return null;
  return (
    <div className="floating-actions mobile-floating-actions settings-floating-actions fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3">
      <FloatingButton
        alwaysVisibleOnMobile
        ariaLabel={tr("Indietro")}
        icon={<ChevronLeft size={27} />}
        onClick={() =>
          location.key === "default"
            ? navigate(ROUTE_PATHS.dashboard, { replace: true })
            : navigate(-1)
        }
      />
    </div>
  );
}
