import useModalViewport from "../hooks/useModalViewport.hook";
import { lockPageScroll } from "../utils/scroll-lock.util";
import IconButton from "./IconButton.component";
import {
  type FC,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import "../styles/Modal.styles.css";
import "../styles/DeleteConfirmation.styles.css";

import { getLiquidGlassClass } from "../assets/constants";

// hooks
import { useTheme } from "../hooks";

type TModalMaxWidth = "sm" | "md" | "lg" | "xl";

interface IProps extends PropsWithChildren {
  isOpen: boolean;
  title: string;
  description?: string;
  /** Optional actions. Omit for dialogs whose content triggers the action directly. */
  footer?: ReactNode;
  isClosable?: boolean;
  closeOnBackdropClick?: boolean;
  maxWidth?: TModalMaxWidth;
  intent?: "default" | "danger";
  onClose: () => void;
}

const MAX_WIDTH_CLASSES: Record<TModalMaxWidth, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

/** Matches the closing animation in System.styles.css (sheet 300ms, dialog 200ms). */
const MODAL_EXIT_MS = 300;
const SHEET_DISMISS_DISTANCE = 110;
const SHEET_DISMISS_VELOCITY = 0.55;

const isSheetLayout = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

const Modal: FC<IProps> = ({
  isOpen,
  title,
  description,
  footer,
  children,
  isClosable = true,
  closeOnBackdropClick = true,
  maxWidth = "md",
  intent = "default",
  onClose,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  // Stay mounted while the closing animation plays, like a native sheet.
  const [isRendered, setIsRendered] = useState(isOpen);
  if (isOpen && !isRendered) setIsRendered(true);
  // Measured for the whole life of the sheet, closing included: dropping the
  // measures on close made the sheet jump while it slid away.
  useModalViewport(isRendered, backdropRef);
  useEffect(() => {
    if (isOpen || !isRendered) return;
    const timer = window.setTimeout(() => setIsRendered(false), MODAL_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, isRendered]);
  const dragRef = useRef<{ startY: number; startTime: number; offset: number } | null>(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    if (!dialogRef.current?.contains(document.activeElement))
      dialogRef.current?.focus({ preventScroll: true });
    const containFocus = (event: KeyboardEvent): void => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    dialogRef.current?.addEventListener("keydown", containFocus);
    const dialog = dialogRef.current;
    return () => {
      dialog?.removeEventListener("keydown", containFocus);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const handleBackdropClick = (): void => {
    if (!closeOnBackdropClick || !isClosable) {
      return;
    }

    onClose();
  };

  const handleModalClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && isClosable) {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClosable, isOpen]);

  // The page stays locked until the sheet has finished sliding away, so
  // nothing under it reflows while it is still on screen (shared counter:
  // overlays opening and closing in the same tap cannot leave it locked).
  useLayoutEffect(() => {
    if (!isRendered) return;
    return lockPageScroll();
  }, [isRendered]);

  // Phones: a field that gets focus is brought into view above the keyboard once
  // the sheet has shrunk to the visible area (useModalViewport).
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    let timer = 0;
    let focused: HTMLElement | null = null;
    const reveal = (): void => {
      if (!focused || !dialog.contains(focused) || !isSheetLayout()) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        focused?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 120);
    };
    const handleFocusIn = (event: FocusEvent): void => {
      const target = event.target as HTMLElement | null;
      if (!target?.matches("input:not([readonly]), textarea, [contenteditable='true']")) return;
      // Fields pinned to the bottom of the sheet are already in place.
      if (target.closest(".modal-bottom-search, .modal-footer")) return;
      focused = target;
      // Wait for the keyboard to open before measuring.
      window.clearTimeout(timer);
      timer = window.setTimeout(reveal, 280);
    };
    const handleFocusOut = (): void => {
      focused = null;
    };
    dialog.addEventListener("focusin", handleFocusIn);
    dialog.addEventListener("focusout", handleFocusOut);
    window.visualViewport?.addEventListener("resize", reveal);
    return () => {
      window.clearTimeout(timer);
      dialog.removeEventListener("focusin", handleFocusIn);
      dialog.removeEventListener("focusout", handleFocusOut);
      window.visualViewport?.removeEventListener("resize", reveal);
    };
  }, [isOpen]);

  // Swipe the sheet down from its header to dismiss it (phones only).
  const handleHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!isClosable || !isSheetLayout() || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    dragRef.current = { startY: event.clientY, startTime: performance.now(), offset: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    dialogRef.current?.setAttribute("data-dragging", "true");
  };

  const handleHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    const dialog = dialogRef.current;
    if (!drag || !dialog) return;
    const delta = event.clientY - drag.startY;
    // Rubber band upwards, follow the finger downwards.
    drag.offset = delta > 0 ? delta : -Math.sqrt(-delta) * 2;
    dialog.style.translate = `0 ${drag.offset}px`;
  };

  const handleHeaderPointerEnd = (): void => {
    const drag = dragRef.current;
    const dialog = dialogRef.current;
    dragRef.current = null;
    if (!drag || !dialog) return;
    dialog.removeAttribute("data-dragging");
    const velocity = drag.offset / Math.max(1, performance.now() - drag.startTime);
    if (
      drag.offset > SHEET_DISMISS_DISTANCE ||
      (drag.offset > 24 && velocity > SHEET_DISMISS_VELOCITY)
    ) {
      onCloseRef.current();
      return;
    }
    dialog.style.translate = "";
  };

  if (!isRendered) {
    return null;
  }

  const isClosing = !isOpen;

  return createPortal(
    <div
      ref={backdropRef}
      role="presentation"
      data-modal-theme={theme}
      data-closing={isClosing ? "true" : undefined}
      inert={isClosing}
      onMouseDown={isClosing ? undefined : handleBackdropClick}
      className="modal-backdrop fixed inset-0 z-1000 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,var(--app-safe-top))] sm:px-5 sm:py-8"
    >
      <div className="modal-placement flex min-h-full items-center justify-center">
        <div
          role="dialog"
          ref={dialogRef}
          tabIndex={-1}
          data-modal-theme={theme}
          data-modal-size={maxWidth}
          data-modal-intent={intent}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          onMouseDown={handleModalClick}
          className={`modal-surface ${getLiquidGlassClass(theme)} relative flex w-full min-w-0 flex-col overflow-hidden ${MAX_WIDTH_CLASSES[maxWidth]}`}
        >
          <div
            className="modal-header shrink-0 px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5"
            onPointerDown={handleHeaderPointerDown}
            onPointerMove={handleHeaderPointerMove}
            onPointerUp={handleHeaderPointerEnd}
            onPointerCancel={handleHeaderPointerEnd}
          >
            <div className="flex items-start justify-between gap-4 sm:gap-5">
              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="modal-title wrap-break-word text-xl leading-7 font-semibold tracking-tight sm:text-2xl sm:leading-8"
                >
                  {title}
                </h2>

                {description && (
                  <p
                    id={descriptionId}
                    className="modal-description mt-2 wrap-break-word text-sm leading-6"
                  >
                    {description}
                  </p>
                )}
              </div>

              <IconButton
                type="button"
                onClick={onClose}
                disabled={!isClosable}
                aria-label={t("modal.close")}
                title={t("modal.close")}
              >
                <X size={18} strokeWidth={2} />
              </IconButton>
            </div>
          </div>

          {children && (
            <div className="modal-content min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              {children}
            </div>
          )}

          {footer && (
            <div className="modal-footer shrink-0 px-5 py-4 sm:px-7 sm:py-5">
              <div className="modal-actions">{footer}</div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
