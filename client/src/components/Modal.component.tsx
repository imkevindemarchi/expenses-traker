import IconButton from "./IconButton.component";
import {
  type FC,
  type MouseEvent,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
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
  appearance?: "default" | "choices" | "entry";
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

const Modal: FC<IProps> = ({
  isOpen,
  appearance = "default",
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
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
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

  useLayoutEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const root = document.documentElement;
    const previousGutter = root.style.scrollbarGutter;
    // Preserve the page width when hiding its existing scrollbar, before paint.
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      data-modal-theme={theme}
      data-modal-appearance={appearance}
      onMouseDown={handleBackdropClick}
      className="modal-backdrop fixed inset-0 z-1000 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-8"
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
          className={`modal-surface ${appearance === "choices" ? "modal-choice-surface" : appearance === "entry" ? "modal-entry-surface" : ""} ${getLiquidGlassClass(theme)} relative flex max-h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top))-max(1.5rem,env(safe-area-inset-bottom)))] w-full min-w-0 flex-col overflow-hidden sm:max-h-[calc(100dvh-4rem)] ${MAX_WIDTH_CLASSES[maxWidth]}`}
        >
          <div className="modal-header shrink-0 px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5">
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

              {appearance !== "choices" && <IconButton
                type="button"
                onClick={onClose}
                disabled={!isClosable}
                aria-label={t("modal.close")}
                title={t("modal.close")}

              >
                <X size={18} strokeWidth={2} />
              </IconButton>}
            </div>
          </div>

          {children && (
            <div className="modal-content min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              {children}
            </div>
          )}

          {footer && (
            <div className="modal-footer shrink-0 px-5 py-4 sm:px-7 sm:py-5">
              <div className="modal-actions">
                {footer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
