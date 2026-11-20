import { useEffect } from "react";

const SEARCH_SELECTOR = ".lg-search-dock input";
const DOCK_SELECTOR = ".lg-search-dock";
/** After the field moves (keyboard opening/closing), a stray tap cannot dismiss it. */
const SETTLE_MS = 650;
/** Taps this close to the capsule count as taps on the field (fingertip margin). */
const DOCK_SLOP = 12;
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Phones: while the bottom search field is focused, keep it right above the
 * on-screen keyboard (like iOS 26/27) and let the tab bar step aside.
 *
 * Mobile Safari keeps position:fixed elements on the layout viewport, so a
 * bottom bar would end up behind the keyboard. The visual viewport tells how
 * much of the screen the keyboard covers; that inset is exposed as
 * --lg-keyboard-inset and html[data-search-focused] switches the layout.
 *
 * Double tap (select / "Paste" on iPhone): the field slides up with the
 * keyboard, so the second tap can land where it was a moment ago, or just
 * outside the capsule. On iOS that tap blurred the field and closed the
 * keyboard. While the field is focused, such taps keep the focus: inside the
 * dock (padding, icon) always, elsewhere for a short time after it moved.
 * Buttons in the dock (clear, "+", filters) still work as usual.
 */
export default function useSearchKeyboard(): void {
  useEffect(() => {
    const root: HTMLElement = document.documentElement;
    const mobile: MediaQueryList = window.matchMedia(MOBILE_QUERY);
    const viewport: VisualViewport | null = window.visualViewport;
    let frame = 0;
    let settleUntil = 0;

    const settle = (): void => {
      settleUntil = performance.now() + SETTLE_MS;
    };

    const update = (): void => {
      frame = 0;
      const covered: number = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      // Below this, it is browser chrome rather than a keyboard.
      const inset: number = covered < 60 ? 0 : covered;
      root.style.setProperty("--lg-keyboard-inset", `${Math.round(inset)}px`);
    };
    const schedule = (): void => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const handleViewportChange = (): void => {
      if (root.dataset.searchFocused) settle();
      schedule();
    };

    const isSearch = (target: EventTarget | null): boolean =>
      target instanceof Element && target.matches(SEARCH_SELECTOR);

    const focusedSearch = (): HTMLInputElement | null => {
      const active: Element | null = document.activeElement;
      return active instanceof HTMLInputElement && active.matches(SEARCH_SELECTOR)
        ? active
        : null;
    };

    const nearDock = (x: number, y: number): boolean => {
      const dock: Element | null = document.querySelector(DOCK_SELECTOR);
      if (!dock) return false;
      const box: DOMRect = dock.getBoundingClientRect();
      return (
        x >= box.left - DOCK_SLOP &&
        x <= box.right + DOCK_SLOP &&
        y >= box.top - DOCK_SLOP &&
        y <= box.bottom + DOCK_SLOP
      );
    };

    /** True when this tap must not take the focus away from the search field. */
    const shouldKeepFocus = (target: EventTarget | null, x: number, y: number): boolean => {
      if (!mobile.matches) return false;
      const input: HTMLInputElement | null = focusedSearch();
      if (!input || target === input) return false; // caret, selection, "Paste": native
      if (target instanceof Element) {
        if (target.closest("button, a, [role='button'], input, select, textarea")) return false;
        if (target.closest(DOCK_SELECTOR)) return true;
      }
      return nearDock(x, y) || performance.now() < settleUntil;
    };

    const handleTouchStart = (event: TouchEvent): void => {
      const touch: Touch | undefined = event.touches[0];
      if (!touch || event.touches.length > 1) return;
      if (!shouldKeepFocus(event.target, touch.clientX, touch.clientY)) return;
      // Keeps the keyboard up and stops the tap reaching the content below.
      event.preventDefault();
      event.stopPropagation();
    };
    const handleMouseDown = (event: MouseEvent): void => {
      if (!shouldKeepFocus(event.target, event.clientX, event.clientY)) return;
      event.preventDefault();
    };

    const handleFocusIn = (event: FocusEvent): void => {
      if (!isSearch(event.target)) return;
      root.dataset.searchFocused = "true";
      settle();
      schedule();
    };
    const handleFocusOut = (event: FocusEvent): void => {
      if (!isSearch(event.target)) return;
      delete root.dataset.searchFocused;
      root.style.setProperty("--lg-keyboard-inset", "0px");
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("touchstart", handleTouchStart, { capture: true, passive: false });
    document.addEventListener("mousedown", handleMouseDown, true);
    viewport?.addEventListener("resize", handleViewportChange);
    viewport?.addEventListener("scroll", schedule);

    return (): void => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("mousedown", handleMouseDown, true);
      viewport?.removeEventListener("resize", handleViewportChange);
      viewport?.removeEventListener("scroll", schedule);
      window.cancelAnimationFrame(frame);
      delete root.dataset.searchFocused;
      root.style.removeProperty("--lg-keyboard-inset");
    };
  }, []);
}
