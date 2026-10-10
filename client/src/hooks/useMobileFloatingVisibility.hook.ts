import { useEffect, useState } from "react";

// Only window scrolling changes visibility; scrolling inside menus does not.
export default function useMobileFloatingVisibility(alwaysVisible = false): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (alwaysVisible) return;
    const media = window.matchMedia("(max-width: 639px)");
    let previousY = Math.max(0, window.scrollY);
    const update = () => {
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
      if (!media.matches || y <= 24) setVisible(true);
      else if (Math.abs(y - previousY) >= 4) setVisible(y < previousY);
      else return;
      previousY = y;
    };
    const reset = () => { previousY = Math.max(0, window.scrollY); setVisible(true); };
    window.addEventListener("scroll", update, { passive: true });
    media.addEventListener("change", reset);
    return () => {
      window.removeEventListener("scroll", update);
      media.removeEventListener("change", reset);
    };
  }, [alwaysVisible]);
  return alwaysVisible || visible;
}
