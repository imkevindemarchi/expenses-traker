/**
 * Phones: once the on-screen keyboard has opened, scroll the page so that
 * `element` sits fully inside the visible area, below the top toolbar and
 * above the keyboard (like iOS forms), instead of where the browser happens
 * to leave it.
 */
const TOP_CLEARANCE = 112;
const BOTTOM_CLEARANCE = 20;
const KEYBOARD_WAIT_MS = 420;

const isTouchPhone = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches;

const align = (element: HTMLElement): void => {
  if (!element.isConnected) return;
  const viewport = window.visualViewport;
  const visibleTop = (viewport?.offsetTop ?? 0) + TOP_CLEARANCE;
  const visibleBottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);
  const rect = element.getBoundingClientRect();
  const room = visibleBottom - BOTTOM_CLEARANCE - visibleTop;

  // Centre the element in the room left by the keyboard; tall ones start at the top.
  const target = rect.height >= room ? visibleTop : visibleTop + (room - rect.height) / 2;
  const delta = rect.top - target;
  if (Math.abs(delta) < 4) return;
  window.scrollBy({ top: delta, behavior: "smooth" });
};

export function revealAboveKeyboard(element: HTMLElement | null): () => void {
  if (!element || !isTouchPhone()) return () => undefined;
  const viewport = window.visualViewport;
  let done = false;
  let timer = 0;

  const run = (): void => {
    if (done) return;
    done = true;
    viewport?.removeEventListener("resize", onResize);
    window.clearTimeout(timer);
    window.requestAnimationFrame(() => align(element));
  };
  // The keyboard animates in: align once it has settled.
  const onResize = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 120);
  };

  viewport?.addEventListener("resize", onResize);
  timer = window.setTimeout(run, KEYBOARD_WAIT_MS);

  return (): void => {
    done = true;
    viewport?.removeEventListener("resize", onResize);
    window.clearTimeout(timer);
  };
}
