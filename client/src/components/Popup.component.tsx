import {
  type CSSProperties,
  type FC,
  type TouchEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircleCheck, CircleX, TriangleAlert, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

// assets
import { getLiquidGlassClass } from "../assets/constants";

// hooks
import { useTheme } from "../hooks";

// types
type TPopupType = "success" | "warning" | "error";
type TPopupState = { type: TPopupType; message: string; title?: string };

interface IProps {
  popup: TPopupState;
  isClosing: boolean;
  onClose: () => void;
}

type TPopupStyle = {
  icon: typeof CircleCheck;
  accentClassName: string;
  glowClassName: string;
  lightIconClassName: string;
  darkIconClassName: string;
  lightBorderClassName: string;
  darkBorderClassName: string;
  lightTitleClassName: string;
  darkTitleClassName: string;
  titleTranslationKey: string;
};

const POPUP_STYLES: Record<TPopupType, TPopupStyle> = {
  success: {
    icon: CircleCheck,
    accentClassName: "bg-success",
    glowClassName: "bg-success/30",
    lightIconClassName:
      "border-success/20 bg-success/10 text-success shadow-[0_8px_24px_rgba(34,197,94,0.10)]",
    darkIconClassName:
      "border-success/25 bg-success/15 text-success shadow-[0_10px_28px_rgba(34,197,94,0.14)]",
    lightBorderClassName: "border-success/20",
    darkBorderClassName: "border-success/25",
    lightTitleClassName: "text-success",
    darkTitleClassName: "text-success",
    titleTranslationKey: "popup.success",
  },
  warning: {
    icon: TriangleAlert,
    accentClassName: "bg-warning",
    glowClassName: "bg-warning/30",
    lightIconClassName:
      "border-warning/20 bg-warning/10 text-warning shadow-[0_8px_24px_rgba(245,158,11,0.10)]",
    darkIconClassName:
      "border-warning/25 bg-warning/15 text-warning shadow-[0_10px_28px_rgba(245,158,11,0.14)]",
    lightBorderClassName: "border-warning/20",
    darkBorderClassName: "border-warning/25",
    lightTitleClassName: "text-warning",
    darkTitleClassName: "text-warning",
    titleTranslationKey: "popup.warning",
  },
  error: {
    icon: CircleX,
    accentClassName: "bg-danger",
    glowClassName: "bg-danger/30",
    lightIconClassName:
      "border-danger/20 bg-danger/10 text-danger shadow-[0_8px_24px_rgba(239,68,68,0.10)]",
    darkIconClassName:
      "border-danger/25 bg-danger/15 text-danger shadow-[0_10px_28px_rgba(239,68,68,0.14)]",
    lightBorderClassName: "border-danger/20",
    darkBorderClassName: "border-danger/25",
    lightTitleClassName: "text-danger",
    darkTitleClassName: "text-danger",
    titleTranslationKey: "popup.error",
  },
};

const SWIPE_CLOSE_THRESHOLD = 18;

const Popup: FC<IProps> = ({ popup, isClosing, onClose }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const touchStartYRef = useRef<number | null>(null);

  const [translateY, setTranslateY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const style: TPopupStyle = useMemo(() => {
    return POPUP_STYLES[popup.type];
  }, [popup.type]);

  const Icon = style.icon;

  const defaultTitle: string = t(style.titleTranslationKey);
  const title: string = popup.title || defaultTitle;

  const role: "alert" | "status" =
    popup.type === "success" ? "status" : "alert";

  const borderClassName: string =
    theme === "light" ? style.lightBorderClassName : style.darkBorderClassName;

  const iconClassName: string =
    theme === "light" ? style.lightIconClassName : style.darkIconClassName;

  const titleClassName: string =
    theme === "light" ? style.lightTitleClassName : style.darkTitleClassName;

  const messageClassName: string =
    theme === "light" ? "text-darkgray/90" : "text-white/88";

  const closeButtonClassName: string =
    theme === "light"
      ? "border-black/8 bg-white/55 text-darkgray/70 hover:border-black/12 hover:bg-white/75 hover:text-darkgray"
      : "border-white/12 bg-black/20 text-white/70 hover:border-white/18 hover:bg-black/30 hover:text-white";

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>): void => {
    if (isClosing) {
      return;
    }

    touchStartYRef.current = event.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>): void => {
    if (touchStartYRef.current === null || isClosing) {
      return;
    }

    const currentY: number = event.touches[0].clientY;
    const difference: number = currentY - touchStartYRef.current;

    // Il popup può essere trascinato solamente verso l'alto.
    setTranslateY(Math.min(0, difference));
  };

  const handleTouchEnd = (): void => {
    if (touchStartYRef.current === null || isClosing) {
      return;
    }

    touchStartYRef.current = null;
    setIsDragging(false);

    if (translateY <= -SWIPE_CLOSE_THRESHOLD) {
      onClose();
      return;
    }

    setTranslateY(0);
  };

  const handleTouchCancel = (): void => {
    touchStartYRef.current = null;
    setIsDragging(false);
    setTranslateY(0);
  };

  const popupStyle: CSSProperties = {
    transform: `translate3d(0, ${translateY}px, 0)`,
    opacity: Math.max(0.35, 1 - Math.abs(translateY) / 150),
    touchAction: "pan-x pan-down",
  };

  return createPortal(
    <div className="pointer-events-none fixed inset-x-3 top-20 z-9999 flex justify-center sm:inset-x-auto sm:right-5 sm:top-5 sm:justify-end">
      <div
        role={role}
        aria-live="polite"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={popupStyle}
        className={`liquid-glass-panel ${!isClosing && !isDragging ? "liquid-glass-panel--shine" : ""} ${
          isClosing
            ? "animate-popup-exit"
            : translateY === 0
              ? "animate-popup-enter"
              : ""
        } ${
          isDragging
            ? "transition-none"
            : "transition-all duration-300 ease-out"
        } ${getLiquidGlassClass(theme)} ${borderClassName} ${
          theme === "light"
            ? "bg-white/78 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
            : "bg-[#0b0b0d]/82 shadow-[0_18px_50px_rgba(0,0,0,0.38)]"
        } pointer-events-auto relative isolate flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-3xl border px-4 py-3.5 select-none sm:max-w-md`}
      >
        <span
          className={`pointer-events-none absolute inset-px rounded-[23px] bg-linear-to-b ${
            theme === "light"
              ? "from-white/80 via-white/28 to-white/8 opacity-95"
              : "from-white/16 via-white/5 to-transparent opacity-90"
          }`}
        />

        <span
          className={`pointer-events-none absolute -left-12 -top-14 size-32 rounded-full blur-3xl ${style.glowClassName}`}
        />

        <span
          className={`pointer-events-none absolute -right-10 -top-14 size-28 rounded-full blur-3xl ${
            theme === "light" ? "bg-white/45" : "bg-white/12"
          }`}
        />

        <span
          className={`pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ${
            theme === "light" ? "ring-white/65" : "ring-white/18"
          }`}
        />

        <span
          className={`pointer-events-none absolute inset-y-3 left-1.5 w-1 rounded-full ${style.accentClassName}`}
        />

        <div
          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border ${iconClassName}`}
        >
          <span className="pointer-events-none absolute inset-px rounded-[13px] bg-linear-to-b from-white/35 via-white/8 to-transparent" />
          <Icon className="relative z-10" size={20} strokeWidth={2.2} />
        </div>

        <div className="relative z-10 min-w-0 flex-1 pt-0.5">
          <h3 className={`text-sm leading-5 font-bold ${titleClassName}`}>
            {title}
          </h3>

          <p
            className={`mt-0.5 wrap-break-word text-[13px] leading-5 ${messageClassName}`}
          >
            {popup.message}
          </p>
        </div>

        <button
          type="button"
          aria-label={t("popup.close")}
          disabled={isClosing}
          onClick={onClose}
          className={`group relative z-10 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[11px] border transition-all duration-300 hover:rotate-90 active:scale-90 disabled:pointer-events-none ${closeButtonClassName}`}
        >
          <span className="pointer-events-none absolute inset-px rounded-[10px] bg-linear-to-b from-white/25 to-transparent opacity-70" />
          <X
            className="relative z-10 transition-transform duration-300 group-hover:scale-110"
            size={16}
            strokeWidth={2}
          />
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default Popup;
