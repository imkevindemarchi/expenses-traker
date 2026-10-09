import {
  type FC,
  type MouseEvent,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
} from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

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
      className="fixed inset-0 z-1000 overflow-y-auto bg-black/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm animate-in fade-in duration-200 sm:px-5 sm:py-8"
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? "modal-description" : undefined}
          onMouseDown={handleModalClick}
          className={`liquid-glass-panel liquid-glass-panel--open relative origin-top flex max-h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top))-max(1.5rem,env(safe-area-inset-bottom)))] w-full min-w-0 flex-col overflow-hidden rounded-[28px] border shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl  sm:max-h-[calc(100dvh-4rem)] sm:rounded-3xl ${MAX_WIDTH_CLASSES[maxWidth]} ${
            theme === "light"
              ? "border-black/10 bg-white/95"
              : "border-white/10 bg-[#111111]/95"
          }`}
        >
          <div
            className={`shrink-0 border-b px-4 py-4 sm:px-6 sm:py-5 ${
              theme === "light" ? "border-black/5" : "border-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-4 sm:gap-5">
              <div className="min-w-0 flex-1">
                <h2
                  id="modal-title"
                  className={`wrap-break-word text-lg font-semibold ${
                    theme === "light" ? "text-black" : "text-white"
                  }`}
                >
                  {title}
                </h2>

                {description && (
                  <p
                    id="modal-description"
                    className={`mt-1.5 wrap-break-word text-sm leading-6 ${
                      theme === "light" ? "text-darkgray" : "text-gray"
                    }`}
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
                className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-200 hover:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                  theme === "light"
                    ? "border-black/5 bg-black/2.5 text-darkgray hover:bg-black/5 hover:text-black"
                    : "border-white/5 bg-white/5 text-gray hover:bg-white/10 hover:text-white"
                }`}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {children && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              {children}
            </div>
          )}

          {footer && (
            <div
              className={`shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4 ${
                theme === "light"
                  ? "border-black/5 bg-white/85"
                  : "border-white/5 bg-[#111111]/85"
              }`}
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
