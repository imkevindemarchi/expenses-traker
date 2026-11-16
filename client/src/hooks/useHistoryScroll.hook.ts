import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

const positions = new Map<string, { x: number; y: number }>();

export default function useHistoryScroll(): void {
  const { key } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const target = navigationType === "POP" ? positions.get(key) : undefined;
    let lastPosition = target ?? { x: 0, y: 0 };
    let restoring = Boolean(target);
    let observer: ResizeObserver | undefined;
    let timeout: number | undefined;
    let frame: number | undefined;

    const finishRestoring = (): void => {
      restoring = false;
      observer?.disconnect();
      window.clearTimeout(timeout);
      lastPosition = { x: window.scrollX, y: window.scrollY };
    };

    const restore = (): void => {
      if (!restoring || !target) return;
      window.scrollTo({ left: target.x, top: target.y, behavior: "instant" });
      if (Math.abs(window.scrollY - target.y) <= 1) finishRestoring();
    };

    const rememberPosition = (): void => {
      // Loading placeholders can temporarily make the document too short.
      if (!restoring) {
        lastPosition = { x: window.scrollX, y: window.scrollY };
        positions.set(key, lastPosition);
      }
    };

    const handleScrollKey = (event: KeyboardEvent): void => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        finishRestoring();
      }
    };

    window.addEventListener("scroll", rememberPosition, { passive: true });
    window.addEventListener("wheel", finishRestoring, { passive: true });
    window.addEventListener("touchstart", finishRestoring, { passive: true });
    window.addEventListener("keydown", handleScrollKey);

    if (target) {
      observer = new ResizeObserver(() => {
        if (frame !== undefined) window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(restore);
      });
      observer.observe(document.body);
      timeout = window.setTimeout(finishRestoring, 30000);
      restore();
    } else {
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    }

    return () => {
      positions.set(key, lastPosition);
      observer?.disconnect();
      window.clearTimeout(timeout);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", rememberPosition);
      window.removeEventListener("wheel", finishRestoring);
      window.removeEventListener("touchstart", finishRestoring);
      window.removeEventListener("keydown", handleScrollKey);
    };
  }, [key, navigationType]);
}
