import { useEffect } from "react";

const TOOLBAR_SELECTOR = ".mobile-floating-actions, .floating-actions";
const MOBILE_QUERY = "(max-width: 767px)";
/** Screen-edge margin and the gap kept between the title and a button. */
const EDGE = 14;
const GAP = 14; // keep in sync with --lg-title-gap (Toolbar.styles.css)
/** Room a large title needs beside the actions; with less it goes on the next row. */
const MIN_LARGE_TITLE_ROOM = 210;
/** Horizontal page margin on phones. */
const PAGE_MARGIN = 16;

/**
 * Phones: measures the room taken by the floating toolbar at the top
 * ("back" on the left, the actions capsule on the right) and exposes it as
 * --lg-toolbar-left / --lg-toolbar-right on <html>. The pinned page title is
 * leading-aligned (data-lg-title="offset"): it starts at --lg-title-start,
 * right after "back" or at the page margin, and uses the free space up to
 * the actions without ever sliding underneath.
 */
export default function useToolbarInsets(): void {
  useEffect(() => {
    const root: HTMLElement = document.documentElement;
    const media: MediaQueryList = window.matchMedia(MOBILE_QUERY);
    const resizeObserver = new ResizeObserver((): void => schedule());
    const observed = new Set<Element>();
    let frame = 0;
    let lastLeft = "";
    let lastRight = "";

    const measure = (): void => {
      frame = 0;
      let left = 0;
      let right = 0;

      if (media.matches) {
        for (const toolbar of document.querySelectorAll<HTMLElement>(TOOLBAR_SELECTOR)) {
          if (!observed.has(toolbar)) {
            observed.add(toolbar);
            resizeObserver.observe(toolbar);
          }

          // Layout widths (offsetWidth), not the rendered box: the buttons
          // enter with a scale animation, which would shrink the measure.
          const back = toolbar.querySelector<HTMLElement>("[data-nav-back]");
          if (back) left = Math.max(left, back.offsetWidth);

          // The capsule only counts when it holds something besides "back".
          const hasActions = Array.from(toolbar.querySelectorAll("button")).some(
            (button) => !button.hasAttribute("data-nav-back"),
          );
          if (hasActions) right = Math.max(right, toolbar.offsetWidth);
        }
      }

      const nextLeft = `${Math.ceil(left)}px`;
      const nextRight = `${Math.ceil(right)}px`;
      if (nextLeft !== lastLeft) root.style.setProperty("--lg-toolbar-left", (lastLeft = nextLeft));
      if (nextRight !== lastRight)
        root.style.setProperty("--lg-toolbar-right", (lastRight = nextRight));

      // The pinned title stays leading-aligned: right after "back", or at the page margin.
      const titleStart = `${Math.ceil(left > 0 ? EDGE + left + GAP : PAGE_MARGIN)}px`;
      if (root.style.getPropertyValue("--lg-title-start") !== titleStart)
        root.style.setProperty("--lg-title-start", titleStart);
      if (root.dataset.lgTitle !== "offset") root.dataset.lgTitle = "offset";

      // Large titles share the row with the actions only when there is room,
      // otherwise they sit on the row below, as in iOS. A "back" button on the
      // leading edge always sends the large title below it.
      const roomBeside: number = window.innerWidth - 2 * PAGE_MARGIN - right - 12;
      const largeTitle: string =
        left > 0 || (right > 0 && roomBeside < MIN_LARGE_TITLE_ROOM) ? "below" : "inline";
      if (root.dataset.lgLargeTitle !== largeTitle) root.dataset.lgLargeTitle = largeTitle;
    };

    function schedule(): void {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }

    // Pages mount and unmount their toolbars, and actions come and go.
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    media.addEventListener("change", schedule);
    window.addEventListener("resize", schedule);
    schedule();

    return (): void => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      media.removeEventListener("change", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
      root.style.removeProperty("--lg-toolbar-left");
      root.style.removeProperty("--lg-toolbar-right");
      root.style.removeProperty("--lg-title-start");
      delete root.dataset.lgTitle;
      delete root.dataset.lgLargeTitle;
    };
  }, []);
}
