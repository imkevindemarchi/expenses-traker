import { useEffect } from "react";
import { useLocation } from "react-router";

const MOBILE_QUERY = "(max-width: 767px)";
/** Ignore tiny movements (finger jitter, rubber-banding). */
const MIN_DELTA = 6;
/** Always show the bar near the top of the page. */
const TOP_ZONE = 80;

/**
 * Phones: the tab bar steps aside while scrolling down and comes back as soon
 * as the user scrolls up, reaches the top or the end of the page — like the
 * iOS 26/27 tab bar. Exposed as html[data-tabbar-hidden] for the CSS, with
 * html[data-scrolled] for the top scroll-edge effect.
 */
export default function useTabBarAutoHide(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const root: HTMLElement = document.documentElement;
    const media: MediaQueryList = window.matchMedia(MOBILE_QUERY);
    let lastY: number = window.scrollY;
    let frame = 0;

    const setScrolled = (scrolled: boolean): void => {
      if (scrolled) root.dataset.scrolled = "true";
      else delete root.dataset.scrolled;
    };

    const setHidden = (hidden: boolean): void => {
      if (hidden) root.dataset.tabbarHidden = "true";
      else delete root.dataset.tabbarHidden;
    };

    const update = (): void => {
      frame = 0;
      const y: number = Math.max(0, window.scrollY);
      const maxY: number = document.documentElement.scrollHeight - window.innerHeight;
      const delta: number = y - lastY;
      // Drives the top scroll-edge effect.
      setScrolled(y > 8);

      if (
        !media.matches ||
        y <= TOP_ZONE ||
        y >= maxY - 4 ||
        root.dataset.searchFocused ||
        document.querySelector(".lg-tabbar-dock[data-more-open]")
      ) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (Math.abs(delta) < MIN_DELTA) return;
      setHidden(delta > 0);
      lastY = y;
    };

    const schedule = (): void => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    // A new page always starts with the bar visible.
    setHidden(false);
    setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", schedule, { passive: true });
    media.addEventListener("change", schedule);

    return (): void => {
      window.removeEventListener("scroll", schedule);
      media.removeEventListener("change", schedule);
      window.cancelAnimationFrame(frame);
      setHidden(false);
      setScrolled(false);
    };
  }, [pathname]);
}
