/**
 * One page scroll lock shared by every overlay (modals, sheets, the "…" menu).
 *
 * Overlays used to save and restore `body.style.overflow` on their own: when
 * one opened while another was closing (e.g. "Switch CRM" in the "…" sheet
 * opens the CRM modal in the same tap), the second saved the first one's
 * "hidden" as the value to restore and the page stayed locked for good.
 * A counter makes the order irrelevant: the page scrolls again only when the
 * last overlay is gone.
 */
let locks = 0;
let savedOverflow = "";
let savedGutter = "";

export function lockPageScroll(): () => void {
  const root = document.documentElement;
  if (locks === 0) {
    savedOverflow = document.body.style.overflow;
    savedGutter = root.style.scrollbarGutter;
    // Keep the page width when its scrollbar goes away (desktop).
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
  }
  locks += 1;

  let released = false;
  return (): void => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks > 0) return;
    document.body.style.overflow = savedOverflow === "hidden" ? "" : savedOverflow;
    root.style.scrollbarGutter = savedGutter;
  };
}
