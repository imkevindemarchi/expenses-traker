import {
  type FC,
  type MouseEvent,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import "../styles/Modal.styles.css";

// hooks
import { useTheme } from "../hooks";

type TModalMaxWidth = "sm" | "md" | "lg" | "xl";

interface IProps extends PropsWithChildren {
  isOpen: boolean;
  title: string;
  description?: string;
  footer?: ReactNode;
  isClosable?: boolean;
  closeOnBackdropClick?: boolean;
  maxWidth?: TModalMaxWidth;
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
  title,
  description,
  footer,
  children,
  isClosable = true,
  closeOnBackdropClick = true,
  maxWidth = "md",
  onClose,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus({ preventScroll: true });
    const containFocus = (event: KeyboardEvent): void => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )).filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); dialogRef.current.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault(); first.focus();
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
        onClose();
      }
    };

    const previousOverflow: string = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return (): void => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClosable, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      onMouseDown={handleBackdropClick}
      className="modal-backdrop fixed inset-0 z-1000 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-8"
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          ref={dialogRef}
          tabIndex={-1}
          data-modal-theme={theme}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          onMouseDown={handleModalClick}
          className={`modal-surface relative flex max-h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top))-max(1.5rem,env(safe-area-inset-bottom)))] w-full min-w-0 flex-col overflow-hidden sm:max-h-[calc(100dvh-4rem)] ${MAX_WIDTH_CLASSES[maxWidth]}`}
        >
          <div
            className="modal-header shrink-0 px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5"
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

              <button
                type="button"
                onClick={onClose}
                disabled={!isClosable}
                aria-label={t("modal.close")}
                title={t("modal.close")}
                className="modal-close flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-[color,background-color,transform] duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {children && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              {children}
            </div>
          )}

          {footer && (
            <div
              className="modal-footer shrink-0 px-5 py-4 sm:px-7 sm:py-5"
            >
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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
