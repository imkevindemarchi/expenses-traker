import { ChevronRight } from "lucide-react";
import useSidebarScrollLock from "../hooks/useSidebarScrollLock.hook";
import { type FC, useEffect, useMemo, useState } from "react";

import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import { PROTECTED_ROUTES } from "../routes/routes.config";
import type { User } from "../types";
export type { Page } from "../routes/routes.config";
type IRoute = (typeof PROTECTED_ROUTES)[number];
// assets
const logoImg = "/expenses-logo.png?v=2";
const logoDarkImg = "/expenses-logo.png?v=2";
import { getLiquidGlassClass } from "../assets/constants";
import "../styles/LiquidGlass.styles.css";
import "../styles/Navbar.styles.css";
import "../styles/NavbarGlass.styles.css";

// components
import AccountMenu from "./AccountMenu.component";
import LanguageSelector from "./LanguageSelector.component";

// hooks
import { useTheme } from "../hooks";

// routes

// types

const Navbar: FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const visibleRoutes: IRoute[] = useMemo(() => {
    return PROTECTED_ROUTES.filter((route: IRoute): boolean => {
      return !(route.is_hidden ?? false);
    });
  }, []);

  const desktopPrimaryRoutes = visibleRoutes;

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

  const desktopRoutes = (
    <nav className="flex min-w-0 items-center justify-center gap-1">
      {desktopPrimaryRoutes.map((protectedRoute: IRoute) => {
        const isMainRoute: boolean = protectedRoute.path === "/";
        const RouteIcon = protectedRoute.icon;

        return (
          <NavLink
            key={protectedRoute.path}
            to={protectedRoute.path}
            end={isMainRoute}
            title={t(`navbar.${protectedRoute.name}`)}
            data-nav-theme={theme}
            className={({ isActive }: { isActive: boolean }) =>
              `nav-tab group relative flex shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-2xl border px-2.5 py-2 font-medium xl:px-3 xl:py-2.5 ${getLiquidGlassClass(theme)} ${isActive ? (theme === "light" ? "border-white/90 text-primary" : "border-white/12 text-primary") : theme === "light" ? "border-white/40 text-darkgray hover:border-white/80 hover:bg-white/45 hover:text-primary" : "border-white/6 text-gray hover:border-white/14 hover:bg-white/8 hover:text-primary"}`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <RouteIcon
                  size={16}
                  strokeWidth={2}
                  className={`nav-tab__icon relative z-10 shrink-0 ${isActive ? "text-primary" : ""}`}
                />

                <span
                  className={`nav-tab__label relative z-10 whitespace-nowrap text-[12px] xl:text-[13px] 2xl:text-sm ${isActive ? "text-primary" : theme === "light" ? "text-black" : "text-white"}`}
                >
                  {t(`navbar.${protectedRoute.name}`)}
                </span>

                <span
                  aria-hidden="true"
                  className="nav-tab__indicator absolute bottom-1 left-1/2 z-10 h-0.75 -translate-x-1/2 rounded-full bg-primary/80"
                />
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const mobileRoutes = (
    <nav aria-label={t("navbar.menu")} className="grid grid-cols-2 gap-2">
      {visibleRoutes.map((protectedRoute: IRoute) => {
        const isMainRoute: boolean = protectedRoute.path === "/";
        const RouteIcon = protectedRoute.icon;


        return (
          <NavLink
            key={protectedRoute.path}
            to={protectedRoute.path}
            end={isMainRoute}
            onClick={handleCloseSidebar}
            data-nav-theme={theme}
            className={({ isActive }: { isActive: boolean }) =>
              `nav-tab-card group relative min-h-23 overflow-hidden rounded-[22px] border p-3 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] opacity-100 ${isActive ? "border-primary/60 bg-primary text-white" : theme === "light" ? "border-white/80 bg-white/52 text-black shadow-[0_10px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]" : "border-white/10 bg-white/5.5 text-white shadow-[0_14px_34px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]"}`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <span className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125" />

                <div className="relative z-10 flex h-full flex-col justify-between gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-[14px] border transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:-translate-y-0.5 group-hover:scale-105 ${isActive ? "border-white/25 bg-white/18 text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]" : theme === "light" ? "border-white bg-white/80 text-primary shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : "border-white/12 bg-white/8 text-primary"}`}
                    >
                      <RouteIcon className="nav-tab__icon" size={18} strokeWidth={2} />
                    </span>

                    <span
                      className={`flex size-6 items-center justify-center rounded-full border transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ${isActive ? "border-white/25 bg-white/18 text-white" : theme === "light" ? "border-black/5 bg-black/2.5 text-darkgray group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary" : "border-white/8 bg-white/5 text-gray group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary"}`}
                    >
                      <ChevronRight
                        size={13}
                        strokeWidth={2.2}
                        className="transition-transform duration-500 group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="block wrap-break-word text-[14px] font-semibold leading-[1.12]">
                      {t(`navbar.${protectedRoute.name}`)}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-white/90 shadow-[0_0_16px_rgba(255,255,255,0.72)]" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full overflow-visible bg-transparent">
        <div className="relative flex h-[calc(6rem+env(safe-area-inset-top))] w-full items-center justify-start overflow-visible px-5 pt-[env(safe-area-inset-top)] md:hidden">
          <NavLink
            to="/"
            end
            aria-label={t("navbar.goToHomepage")}
            className="app-brand-logo group inline-flex absolute bottom-4 left-5 size-18 items-center justify-center transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            data-glass-theme={theme}
          >
            <img
              src={theme === "light" ? logoImg : logoDarkImg}
              alt="Expenses Traker"
              className="relative z-10 h-full w-full object-contain transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.08] group-active:scale-90"
            />
          </NavLink>
        </div>

        <div className="relative hidden overflow-visible px-6 py-4 md:block lg:px-10 xl:px-14 2xl:px-20">
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 xl:gap-6">
            <NavLink
              to="/"
              end
              aria-label={t("navbar.goToHomepage")}
              className="app-brand-logo group inline-flex relative size-18 shrink-0 xl:size-20 2xl:size-22 items-center justify-center transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              data-glass-theme={theme}
            >
              <img
                src={theme === "light" ? logoImg : logoDarkImg}
                alt="Expenses Traker"
                className="relative z-10 h-full w-full object-contain transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.08] group-active:scale-90"
              />
            </NavLink>

            <div className="min-w-0">
              <div
                className={`mx-auto w-fit max-w-full rounded-3xl border px-1.5 py-1.5 xl:px-2 ${getLiquidGlassClass(theme)} ${theme === "light" ? "border-white/55" : "border-white/10"}`}
              >
                {desktopRoutes}
              </div>
            </div>

            <div className="relative z-60 flex shrink-0 items-center justify-end gap-2 overflow-visible xl:gap-3 2xl:gap-4">
              <LanguageSelector />
              <AccountMenu
                username={user.name}
                surname={user.surname}
                email={user.email}
                onLogout={onLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <button
        type="button"
        onClick={handleToggleSidebar}
        aria-label={isSidebarOpen ? t("navbar.closeMenu") : t("navbar.menu")}
        aria-expanded={isSidebarOpen}
        aria-controls="mobile-sidebar"
        data-glass-theme={theme}
        className={`glass-surface group fixed right-5 top-[calc(env(safe-area-inset-top)+1.5rem)] z-100 flex size-14 cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:scale-[0.9] md:hidden ${isSidebarOpen ? "rotate-90" : "rotate-0"}`}
      >
        {/* <span className="pointer-events-none absolute inset-px rounded-[17px] bg-linear-to-b from-white/35 via-white/5 to-transparent opacity-70" />
        <span className="pointer-events-none absolute -left-7 -top-9 size-16 rounded-full bg-white/45 blur-2xl transition-transform duration-700 group-hover:translate-x-14 group-hover:translate-y-10" />
        <span className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/12" /> */}

        <span className="relative z-10 block h-7 w-8 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.08] group-active:scale-90">
          <span
            className={`absolute left-0 h-0.75 w-8 rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${isSidebarOpen ? "top-3 rotate-45 bg-primary" : `top-0.5 rotate-0 ${theme === "light" ? "bg-black" : "bg-white"}`}`}
          />
          <span
            className={`absolute left-0 top-3 h-0.75 rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-300 ease-out ${isSidebarOpen ? "w-0 translate-x-4 opacity-0 bg-primary" : `w-6 translate-x-0 opacity-100 ${theme === "light" ? "bg-black" : "bg-white"}`}`}
          />
          <span
            className={`absolute left-0 h-0.75 w-8 rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${isSidebarOpen ? "top-3 -rotate-45 bg-primary" : `top-5.5 rotate-0 ${theme === "light" ? "bg-black" : "bg-white"}`}`}
          />
        </span>
      </button>

      <button
        type="button"
        aria-label={t("navbar.closeMenu")}
        onClick={handleCloseSidebar}
        tabIndex={isSidebarOpen ? 0 : -1}
        className={`fixed inset-0 z-70 bg-black/25 transition-opacity duration-200 ease-out md:hidden ${isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <div
        inert={!isSidebarOpen}
        className={`liquid-glass-sidebar-motion liquid-glass-sidebar-surface ${getLiquidGlassClass(theme)} fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] top-[max(0.75rem,env(safe-area-inset-top))] z-80 md:hidden ${isSidebarOpen ? "liquid-glass-sidebar-motion--open" : "liquid-glass-sidebar-motion--closed"}`}
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
            className={`relative z-10 mb-2 flex shrink-0 items-center justify-between gap-3 rounded-[22px] p-2.5 transition-[opacity,translate] duration-200 ease-out opacity-100`}
          >
            <NavLink
              to="/"
              end
              aria-label={t("navbar.goToHomepage")}
              onClick={handleCloseSidebar}
              className="group flex min-w-0 items-center gap-3"
            >
              <span
                data-glass-theme={theme}
                className="app-brand-logo group inline-flex relative size-22 items-center justify-center transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <img
                  src={theme === "light" ? logoImg : logoDarkImg}
                  alt="Expenses Traker"
                  className="relative z-10 h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
              </span>
            </NavLink>
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
            {mobileRoutes}
          </div>

          <div
            className={`relative z-20 mt-2 flex shrink-0 items-center justify-between overflow-visible rounded-[22px] border p-2.5 transition-[opacity,translate] duration-200 ease-out opacity-100 ${theme === "light" ? "border-white/85 bg-white/48 shadow-[0_12px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]" : "border-white/10 bg-white/5 shadow-[0_14px_30px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.07)]"}`}
          >
            <LanguageSelector
              className="[&>button]:size-12 [&>button]:justify-center [&>button]:gap-0 [&>button]:p-0 [&>button>svg]:hidden [&>button>span:nth-child(2)]:hidden"
              placement="top"
              alignment="left"
            />
            <AccountMenu
              username={user.name}
              surname={user.surname}
              email={user.email}
              onLogout={onLogout}
              placement="top"
              alignment="right"
            />
          </div>
        </aside>
      </div>
    </>
  );
};

export default Navbar;