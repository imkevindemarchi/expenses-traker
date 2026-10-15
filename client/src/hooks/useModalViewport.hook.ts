import { useLayoutEffect, type RefObject } from "react";

/** Keep mobile dialogs inside the visible area when Safari opens the keyboard. */
export default function useModalViewport(isOpen: boolean, backdropRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    if (!isOpen || !backdrop) return;
    const viewport = window.visualViewport;
    const mobile = window.matchMedia("(max-width: 639px)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!mobile.matches) {
        backdrop.style.removeProperty("--modal-viewport-height");
        backdrop.style.removeProperty("--modal-viewport-top");
        delete backdrop.dataset.modalKeyboard;
        return;
      }
      backdrop.style.setProperty("--modal-viewport-height", (viewport?.height ?? window.innerHeight) + "px");
      backdrop.style.setProperty("--modal-viewport-top", (viewport?.offsetTop ?? 0) + "px");
      const focused = document.activeElement;
      const editing = focused instanceof HTMLElement && (focused.matches("input, textarea, select") || focused.isContentEditable);
      if (editing && window.innerHeight - (viewport?.height ?? window.innerHeight) > 100) backdrop.dataset.modalKeyboard = "true";
      else delete backdrop.dataset.modalKeyboard;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    mobile.addEventListener("change", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mobile.removeEventListener("change", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      backdrop.style.removeProperty("--modal-viewport-height");
      backdrop.style.removeProperty("--modal-viewport-top");
      delete backdrop.dataset.modalKeyboard;
    };
  }, [isOpen, backdropRef]);
}
