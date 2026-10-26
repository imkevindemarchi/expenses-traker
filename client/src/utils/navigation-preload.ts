import { createPreloader } from "./preload.util";
import { lazy, useEffect, type ComponentType } from "react";
import { matchPath, useLocation } from "react-router";

const pages: { paths: string[]; preload: () => Promise<unknown> }[] = [];

/** Share the import promise between intent preloading and React's lazy render. */
// Match React.lazy's component constraint while retaining each page's inferred props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>, paths: string[]) {
  const preload = createPreloader(load);
  pages.push({ paths, preload });
  return lazy(preload);
}

export function useNavigationPreload(warmPaths: string[] = []) {
  const { pathname } = useLocation();
  const warmKey = warmPaths.join("|");
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return;
    const preloadPath = (target: string) => {
      const page = pages.find((page) => page.paths.includes(target)) ?? pages.find((page) => page.paths.some((pattern) => matchPath(pattern, target)));
      // A speculative failure must never interrupt the current page.
      if (page) void page.preload().catch(() => {});
    };
    const intent = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest("a[href], [data-preload-path]");
      if (!element) return;
      const target = element.getAttribute("data-preload-path") ?? element.getAttribute("href");
      if (!target) return;
      const url = new URL(target, window.location.href);
      if (url.origin === window.location.origin) preloadPath(url.pathname);
    };
    document.addEventListener("pointerover", intent, { passive: true });
    document.addEventListener("pointerdown", intent, { passive: true });
    document.addEventListener("focusin", intent);
    // Warm only likely next screens, after the current route has had time to render.
    const timer = window.setTimeout(() => warmKey.split("|").filter(Boolean).forEach(preloadPath), 800);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerover", intent);
      document.removeEventListener("pointerdown", intent);
      document.removeEventListener("focusin", intent);
    };
  }, [pathname, warmKey]);
}
