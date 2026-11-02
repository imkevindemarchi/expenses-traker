import { useEffect, useState } from "react";
import { useLocation } from "react-router";

// Only window scrolling changes visibility; scrolling inside menus does not.
export default function useMobileFloatingVisibility(alwaysVisible = false): boolean {
  const { pathname } = useLocation();
  const [visibility, setVisibility] = useState({ pathname, visible: true });
  if (visibility.pathname !== pathname) {
    setVisibility({ pathname, visible: true });
  }
  useEffect(() => {
    if (alwaysVisible) return;
    const setVisible = (visible: boolean) =>
      setVisibility((previous) =>
        previous.pathname === pathname && previous.visible === visible
          ? previous
          : { pathname, visible },
      );
    const media = window.matchMedia("(max-width: 639px)");
    let previousY = Math.max(0, window.scrollY);
    const update = () => {
      const y = Math.max(
        0,
        Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight),
      );
      if (!media.matches || y <= 24) setVisible(true);
      else if (Math.abs(y - previousY) >= 4) setVisible(y < previousY);
      else return;
      previousY = y;
    };
    const reset = () => {
      previousY = Math.max(0, window.scrollY);
      setVisible(true);
    };
    window.addEventListener("scroll", update, { passive: true });
    media.addEventListener("change", reset);
    return () => {
      window.removeEventListener("scroll", update);
      media.removeEventListener("change", reset);
    };
  }, [alwaysVisible, pathname]);
  return alwaysVisible || visibility.pathname !== pathname || visibility.visible;
}
