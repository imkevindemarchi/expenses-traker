import { useEffect } from "react";

const SEARCH_SELECTOR = ".lg-search-dock input";

/**
 * Phones: while the bottom search field is focused, keep it right above the
 * on-screen keyboard (like iOS 26/27) and let the tab bar step aside.
 *
 * Mobile Safari keeps position:fixed elements on the layout viewport, so a
 * bottom bar would end up behind the keyboard. The visual viewport tells how
 * much of the screen the keyboard covers; that inset is exposed as
 * --lg-keyboard-inset and html[data-search-focused] switches the layout.
 */
export default function useSearchKeyboard(): void {
  useEffect(() => {
    const root: HTMLElement = document.documentElement;
    const viewport: VisualViewport | null = window.visualViewport;
    let frame = 0;

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

    const isSearch = (target: EventTarget | null): boolean =>
      target instanceof Element && target.matches(SEARCH_SELECTOR);

    const handleFocusIn = (event: FocusEvent): void => {
      if (!isSearch(event.target)) return;
      root.dataset.searchFocused = "true";
      schedule();
    };
    const handleFocusOut = (event: FocusEvent): void => {
      if (!isSearch(event.target)) return;
      delete root.dataset.searchFocused;
      root.style.setProperty("--lg-keyboard-inset", "0px");
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);

    return (): void => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.cancelAnimationFrame(frame);
      delete root.dataset.searchFocused;
      root.style.removeProperty("--lg-keyboard-inset");
    };
  }, []);
}
