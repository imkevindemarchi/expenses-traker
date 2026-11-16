import RouteSkeleton from "./RouteSkeleton.component";
import { Suspense, type FC, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router";

// components
import Navbar from "./Navbar.component";

// hooks
import { useTheme } from "../hooks";
import useHistoryScroll from "../hooks/useHistoryScroll.hook";
import useToolbarInsets from "../hooks/useToolbarInsets.hook";
import useSearchKeyboard from "../hooks/useSearchKeyboard.hook";
import useTabBarAutoHide from "../hooks/useTabBarAutoHide.hook";

// routes
import { ROUTE_PATHS } from "../routes/routes.config";

// types
import type { User } from "../types";

interface IProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
}

/** App shell: glass sidebar (desktop), tab bar (phones) and the page column. */
const Layout: FC<IProps> = ({ user, onLogout, children }) => {
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const standaloneSettings = pathname === ROUTE_PATHS.settings;
  useHistoryScroll();
  useToolbarInsets();
  useSearchKeyboard();
  useTabBarAutoHide();

  return (
    <div
      className={`app-layout app-layout--tabbar relative flex min-h-dvh w-full flex-col ${
        theme === "light" ? "bg-canvas-light" : "bg-canvas-dark"
      }`}
    >
      <div className="lg-wallpaper" aria-hidden="true">
        <span className="lg-wallpaper__ring" />
      </div>
      {/* The mobile dock stays on every page; settings skips the top bar. */}
      <Navbar user={user} onLogout={onLogout} dockOnly={standaloneSettings} />

      <div className="flex w-full min-w-0 flex-1 flex-col">
        <div
          className={`${standaloneSettings ? "standalone-settings-page immersive-page-container" : ""} app-page-container flex w-full min-w-0 flex-1 flex-col px-5 pb-40 pt-[calc(7.5rem+var(--app-safe-top))] sm:px-0 md:px-20 md:py-8 md:pt-32`}
        >
          {/* Each page fades in on arrival (not on "back": iOS animates that itself). */}
          <div
            key={pathname}
            className="lg-page"
            data-enter={navigationType === "POP" ? undefined : "true"}
          >
            <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
