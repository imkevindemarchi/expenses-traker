import { type CSSProperties, type FC, useRef } from "react";
import { Ellipsis, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";

import LiquidGlassFilter from "./LiquidGlassFilter.component";
import { getSidebarGroups } from "./Navbar.component";
import { ROUTE_PATHS } from "../routes/routes.config";
import "../styles/v2/TabBar.styles.css";

interface IProps {
  isMoreOpen: boolean;
  onToggleMore: () => void;
}

/** iOS-style floating glass tab bar, shown on phones only. */
const MobileTabBar: FC<IProps> = ({ isMoreOpen, onToggleMore }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const barRef = useRef<HTMLElement | null>(null);

  // The same pages as the sidebar, in the same order.
  const tabs = getSidebarGroups().flatMap((group) => group.links);

  const activeIndex = tabs.findIndex((tab) =>
    tab.path === ROUTE_PATHS.dashboard
      ? pathname === tab.path
      : pathname === tab.path || pathname.startsWith(`${tab.path}/`),
  );

  return (
    <div className="lg-tabbar-dock" data-more-open={isMoreOpen || undefined}>
      <nav
        ref={barRef}
        aria-label={t("navbar.menu")}
        className="lg-tabbar lg-glass lg-glass--thick lg-refract"
        style={
          {
            "--lg-tab-count": tabs.length,
            "--lg-tab-index": Math.max(activeIndex, 0),
          } as CSSProperties
        }
      >
        <LiquidGlassFilter targetRef={barRef} id="lg-refract-tabbar" />
        <span
          aria-hidden="true"
          className="lg-tabbar__bubble"
          data-hidden={activeIndex < 0 || undefined}
        />
        {tabs.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === ROUTE_PATHS.dashboard}
            className={({ isActive }) =>
              `lg-tabbar__item${isActive ? " lg-tabbar__item--active" : ""}`
            }
          >
            <Icon className="lg-tabbar__icon" strokeWidth={2.1} aria-hidden="true" />
            <span className="lg-tabbar__label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onToggleMore}
        aria-expanded={isMoreOpen}
        aria-controls="mobile-sidebar"
        aria-label={isMoreOpen ? t("navbar.closeMenu") : t("navbar.menu")}
        className="lg-tabbar-more lg-glass lg-glass--thick lg-press"
      >
        <span className="lg-tabbar-more__icon" data-open={isMoreOpen || undefined}>
          <Ellipsis strokeWidth={2.4} aria-hidden="true" />
          <X strokeWidth={2.4} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
};

export default MobileTabBar;
