import useSidebarScrollLock from "../hooks/useSidebarScrollLock.hook";
import { type FC, useEffect, useState } from "react";
import { CalendarRange, ChartNoAxesCombined, ListOrdered, Settings, Shapes } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import "../styles/v2/Sidebar.styles.css";

// assets
import { getLiquidGlassClass } from "../assets/constants";

// components
import AccountMenu from "./AccountMenu.component";
import LanguageSelector from "./LanguageSelector.component";
import MobileTabBar from "./MobileTabBar.component";

// hooks
import { useTheme } from "../hooks";

// i18n
import { tr } from "../i18n";

// routes
import { ROUTE_PATHS } from "../routes/routes.config";

// types
import type { User } from "../types";
import type { LucideIcon } from "lucide-react";

const LOGO_SRC = "/expenses-logo.png?v=2";

interface INavbarProps {
  user: User;
  onLogout: () => void;
  /** Settings: no top bar, only the mobile dock (tab bar). */
  dockOnly?: boolean;
}

type TSidebarLink = { path: string; label: string; icon: LucideIcon };
type TSidebarGroup = { title: string; links: TSidebarLink[] };

/** Routes of the desktop sidebar, grouped like the iPadOS sidebar. */
export const getSidebarGroups = (): TSidebarGroup[] => [
  {
    title: tr("Panoramica"),
    links: [
      { path: ROUTE_PATHS.dashboard, label: tr("Mensile"), icon: ChartNoAxesCombined },
      { path: ROUTE_PATHS.annual, label: tr("Annuale"), icon: CalendarRange },
      { path: ROUTE_PATHS.entries, label: tr("Movimenti"), icon: ListOrdered },
    ],
  },
  {
    title: tr("Gestione"),
    links: [{ path: ROUTE_PATHS.management, label: tr("Categorie"), icon: Shapes }],
  },
];

const Navbar: FC<INavbarProps> = ({ user, onLogout, dockOnly = false }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const sidebarGroups = getSidebarGroups();

  const handleToggleSidebar = (): void => {
    setIsSidebarOpen((previousValue: boolean): boolean => !previousValue);
  };

  const handleCloseSidebar = (): void => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleCloseSidebar();
  }, [location.pathname]);

  useSidebarScrollLock(isSidebarOpen, handleCloseSidebar);

  const desktopSidebar = (
    <aside className="lg-sidebar" aria-label={t("navbar.menu")} data-glass-theme={theme}>
      <NavLink
        to={ROUTE_PATHS.dashboard}
        end
        aria-label={t("navbar.goToHomepage")}
        className="lg-sidebar__brand"
      >
        <img src={LOGO_SRC} alt="" aria-hidden="true" />
        <span className="lg-sidebar__brand-name">Expenses Traker</span>
      </NavLink>

      <nav className="lg-sidebar__nav">
        {sidebarGroups.map((group) => (
          <section key={group.title} className="lg-sidebar__group" aria-label={group.title}>
            <h2 className="lg-sidebar__heading">{group.title}</h2>
            {group.links.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === ROUTE_PATHS.dashboard}
                title={`${group.title} · ${label}`}
                className="lg-sidebar__item"
              >
                <Icon className="lg-sidebar__icon" aria-hidden="true" />
                <span className="lg-sidebar__label">{label}</span>
              </NavLink>
            ))}
          </section>
        ))}
      </nav>

      <div className="lg-sidebar__footer">
        <div className="lg-sidebar__tools">
          <LanguageSelector
            placement="top"
            alignment="left"
            className="lg-sidebar__tool lg-sidebar__language"
          />
          <NavLink
            to={ROUTE_PATHS.settings}
            title={t("navbar.settings")}
            aria-label={t("navbar.settings")}
            className="lg-sidebar__settings"
          >
            <Settings aria-hidden="true" />
          </NavLink>
        </div>
        <AccountMenu
          placement="top"
          alignment="left"
          className="lg-sidebar__account"
          logoutOnly
          username={user.name}
          surname={user.surname}
          email={user.email}
          onLogout={onLogout}
        />
      </div>
    </aside>
  );

  return (
    <>
      {!dockOnly && (
        <header className="crm-navbar fixed inset-x-0 top-0 z-50 w-full overflow-visible bg-transparent md:hidden">
          <div className="relative flex h-[calc(6rem+var(--app-safe-top))] w-full items-center justify-start overflow-visible px-5 pt-[var(--app-safe-top)] md:hidden">
            <NavLink
              to={ROUTE_PATHS.dashboard}
              end
              aria-label={t("navbar.goToHomepage")}
              className="app-brand-logo group inline-flex absolute bottom-4 left-[max(1.25rem,env(safe-area-inset-left))] size-18 items-center justify-center transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <img
                src={LOGO_SRC}
                alt="Expenses Traker"
                className="relative z-10 h-full w-full object-contain transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.08] group-active:scale-90"
              />
            </NavLink>
          </div>
        </header>
      )}

      {desktopSidebar}

      <MobileTabBar isMoreOpen={isSidebarOpen} onToggleMore={handleToggleSidebar} />

      <button
        type="button"
        aria-label={t("navbar.closeMenu")}
        onClick={handleCloseSidebar}
        tabIndex={isSidebarOpen ? 0 : -1}
        className={`fixed inset-0 z-70 bg-black/25 transition-opacity duration-200 ease-out md:hidden ${isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <div
        className={`liquid-glass-sidebar-motion liquid-glass-sidebar-surface ${getLiquidGlassClass(theme)} lg-more-sheet fixed z-80 md:hidden ${isSidebarOpen ? "liquid-glass-sidebar-motion--open" : "liquid-glass-sidebar-motion--closed"}`}
      >
        <aside
          id="mobile-sidebar"
          aria-hidden={!isSidebarOpen}
          className="liquid-glass-sidebar-content relative flex h-full w-full flex-col overflow-hidden rounded-4xl p-3"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-px rounded-[31px] bg-linear-to-br from-white/25 via-transparent to-primary/8"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-1 rounded-[28px] border border-white/10"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-px h-px bg-linear-to-r from-transparent via-white/80 to-transparent"
          />

          <div
            className={`relative z-20 grid grid-cols-[3rem_minmax(0,1fr)] gap-2 shrink-0 items-center overflow-visible rounded-[22px] border p-2.5 transition-[opacity,translate] duration-200 ease-out opacity-100 ${theme === "light" ? "border-white/85 bg-white/48 shadow-[0_12px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]" : "border-white/10 bg-white/5 shadow-[0_14px_30px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.07)]"}`}
          >
            <LanguageSelector
              className="[&>button]:size-12 [&>button]:justify-center [&>button]:gap-0 [&>button]:p-0 [&>button>svg]:hidden [&>button>span:nth-child(2)]:hidden"
              placement="top"
              alignment="left"
            />
            <AccountMenu
              className="min-w-0 [&>button]:w-full [&>button]:min-w-0 [&>button]:gap-2 [&>button]:px-2"
              placement="top"
              alignment="right"
              username={user.name}
              surname={user.surname}
              email={user.email}
              onLogout={onLogout}
            />
          </div>
        </aside>
      </div>
    </>
  );
};

export default Navbar;
